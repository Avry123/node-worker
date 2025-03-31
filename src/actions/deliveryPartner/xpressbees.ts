"use server";

import axios from "axios";

import { OrderStatus, Prisma } from "@prisma/client";
// import { revalidatePath } from "next/cache";
// import { getDeliveryPartnerId } from "../orders";
import { getDeliveryPartnerToken } from "./tokenManager";
import prisma from "../../lib/prisma";


export async function createXpressbeesOrder(orderId: number, id: string) {
  try {
    const token = await getDeliveryPartnerToken("xpressbees");
    const reference_id = orderId + Math.floor(Math.random() * 1000).toString();

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        customerAddress: true,
        Packages: true,
        Users: {
          select: {
            StoreName: true,
          },
        },
      },
    });
    if (!order) {
      console.error("Order not found");
      return { success: false, error: "Order not found" };
    }

    const warehouseAddress = await prisma.address.findFirst({
      where: {
        id: order.agentAddressId || undefined,
      },
    });

    const rtoWarehouseAddress = await prisma.address.findUnique({
      where: { id: order.rtoAgentAddressId ?? undefined },
    });

    if (!warehouseAddress || !rtoWarehouseAddress) {
      console.error("Warehouse address or RTO warehouse address not found");
      return {
        success: false,
        error: "Warehouse address or RTO warehouse address not found",
      };
    }

    const customerAddress = order.customerAddress;
    if (!customerAddress) {
      console.error("Customer address not found");
      return { success: false, error: "Customer address not found" };
    }

    const collectableAmount =
      order.paymentMode?.toLowerCase() === "prepaid"
        ? 0
        : order.totalOrderValue;

    const requestBody = {
      order_number: reference_id,
      payment_type: order.paymentMode?.toLowerCase(),
      order_amount: order.totalOrderValue,
      package_weight: order.applicableWeight
        ? Math.round(order.applicableWeight.toNumber())
        : 0,
      package_length: order.length?.toString(),
      package_breadth: order.breadth?.toString(),
      package_height: order.height?.toString(),
      consignee: {
        name: customerAddress.fullName,
        address: customerAddress.address,
        address_2: customerAddress.landmark || "",
        city: customerAddress.city,
        state: customerAddress.state,
        pincode: customerAddress.pincode,
        phone: customerAddress.contactNumber,
      },
      pickup: {
        warehouse_name: warehouseAddress.tag,
        name: order?.Users?.StoreName || warehouseAddress.tag,
        address: warehouseAddress.address,
        address_2:
          warehouseAddress.landmark == " " ? "null" : warehouseAddress.landmark,
        city: warehouseAddress.city,
        state: warehouseAddress.state,
        pincode: warehouseAddress.pincode.toString(),
        phone: warehouseAddress.contactNumber,
      },
      order_items: order.Packages.map((item) => ({
        name: item.productName,
        qty: item.quantity,
        price: parseFloat(item.price),
      })),
      courier_id: id,
      collectable_amount: collectableAmount,
    };

    try {
      const response = await axios.post(
        "https://shipment.xpressbees.com/api/shipments2",
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log(JSON.stringify(requestBody), "requestBody for xpressbees");
      if (response.status === 200 && response.data.data.awb_number) {
        const result = await prisma.$transaction(async (prismaTransaction) => {
          const updatedOrder = await prismaTransaction.orders.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.READY_TO_SHIP,
              awbNumber: response.data.data.awb_number,
              shippingDate: new Date(),
            },
          });
          return updatedOrder;
        });

        // revalidatePath("/orders");

        const safeToNumber = (
          value: Prisma.Decimal | null | undefined,
        ): number | null => {
          return value ? value.toNumber() : null;
        };

        return {
          success: true,
          order: {
            ...result,
            deadWeight: safeToNumber(result.deadWeight),
            breadth: safeToNumber(result.breadth),
            height: safeToNumber(result.height),
            length: safeToNumber(result.length),
            applicableWeight: safeToNumber(result.applicableWeight),
            totalOrderValue: safeToNumber(result.totalOrderValue),
          },
          awbNumber: response.data.data.awb_number,
        };
      } else {
        JSON.stringify({
          data: "Failed to create order with Xpressbees",
          error: response.data.data,
          path: "deliveryPartner/xpressbees",
        });
      }
    } catch (axiosError: any) {
      if (axiosError.response) {
        const errorMessage =
          axiosError.response.data.message || "Pincode not serviceable";
        return {
          success: false,
          error: errorMessage,
        };
      } else if (axiosError.request) {
        return {
          success: false,
          error: "No response received from Xpressbees",
        };
      } else {
        return {
          success: false,
          error: axiosError.message,
        };
      }
    }
  } catch (error) {
    JSON.stringify({
      data: "Error in createXpressbeesOrder:",
      errorDetails: error,
      path: "deliveryPartner/xpressbees",
    });

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function cancelXpressbeesOrder(
  awbNumber: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getDeliveryPartnerToken("xpressbees");
    const response = await axios.post(
      "https://shipment.xpressbees.com/api/shipments2/cancel",
      {
        awb: awbNumber,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Handle specific success conditions
    if (
      response.data.status === true ||
      (response.data.status === false &&
        (response.data.message === "Unable to cancel" ||
          response.data.message === "Unable to cancel order"))
    ) {
      console.log(
        JSON.stringify({
          data: "Xpressbees order cancellation handled successfully:",
          responseDetails: response.data,
          path: "deliveryPartner/xpressbees",
        }),
      );
      return { success: true, message: response.data.message };
    } else {
      console.error(
        JSON.stringify({
          data: "Failed to cancel Xpressbees order:",
          errorDetails: response.data,
          path: "deliveryPartner/xpressbees",
        }),
      );
      return {
        success: false,
        message: response.data.message || "Unable to cancel order",
      };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle 404 with specific response body
      if (
        error.response?.status === 404 &&
        error.response?.data?.status === false &&
        error.response?.data?.message === "Unable to cancel"
      ) {
        console.log(
          JSON.stringify({
            data: "Xpressbees order cancellation handled successfully (404 case):",
            responseDetails: error.response?.data,
            path: "deliveryPartner/xpressbees",
          }),
        );
        return {
          success: true,
          message:
            error.response?.data?.message || "Order cancellation processed",
        };
      }

      // Log other Axios errors
      console.error(
        JSON.stringify({
          errorDetails: error.response?.data || error.message,
          path: "deliveryPartner/xpressbees",
        }),
      );
      return {
        success: false,
        message: "An error occurred while cancelling the order",
      };
    } else {
      // Log unexpected errors
      console.error(
        JSON.stringify({
          errorDetails: error,
          path: "deliveryPartner/xpressbees",
        }),
      );
      return {
        success: false,
        message: "An unexpected error occurred while cancelling the order",
      };
    }
  }
}


export async function createXpressbeesNdr(order: any, data: any) {
  console.log("Starting createXpressbeesNdr for orderId:", order.orderId);
  console.log("Data:", data);
  
  try {
    const token = await getDeliveryPartnerToken("xpressbees")
    
    const orders = await prisma.orders.findUnique({
      where: { orderId: Number(order.orderId) },
      include: {
        customerAddress: true,
        Packages: true,
        Users: {
          select: {
            StoreName: true,
          },
        },
      },
    });
    
    if (!orders) {
      return { success: false, error: "Order not found" };
    }
    
    if (!orders.awbNumber) {
      return { success: false, error: "AWB number is missing" };
    }
    
    let actionType = "re-attempt"; 
    const actionData: any = {};
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0]; 
    
    actionData.re_attempt_date = formattedDate;

    const isReAttemptOnly = JSON.stringify(data) === "{}"

    if (!isReAttemptOnly) {    
      if (data?.address && data?.phone) {
      actionType = "change_address";
      actionData.name = orders.customerAddress?.fullName
      actionData.address_1 = data.address;
      actionData.phone = data.phone;
      delete actionData.re_attempt_date;
    } 
 
    else if (data?.address) {
      actionType = "change_address";
      actionData.name = orders.customerAddress?.fullName
      actionData.address_1 = data.address;
      delete actionData.re_attempt_date;
    } 

    else if (data?.phone) {
      actionType = "change_phone";
      actionData.phone = data.phone;
      delete actionData.re_attempt_date;
    }}
    

    
    const requestBody = [
      {
        awb: orders.awbNumber,
        action: actionType,
        action_data: actionData
      }
    ];
    
    console.log("XpressBees NDR request body:", JSON.stringify(requestBody));
    
    try {
      const response = await axios.post(
        "https://shipment.xpressbees.com/api/ndr/create",
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("XpressBees NDR Response:", response.data);
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        const result = response.data[0]; 
        
        if (result.status === true) {

          if ((actionType === "change_address" || actionType === "change_phone") && 
              (data.address || data.phone)) {
            try {
              const customerId = orders.forwardCustomerId || orders.reverseCustomerId;
              
              if (customerId) {
                await prisma.customerAddress.update({
                  where: {
                    customerId: customerId
                  },
                  data: {
                    address: data.address || undefined,
                    contactNumber: data.phone || undefined
                  }
                });
                console.log("Customer address updated successfully");
              }
            } catch (dbError) {
              console.error("Error updating customer address:", dbError);
     
            }
          }
          
          return { 
            success: true, 
            message: `XpressBees NDR ${actionType} created successfully`,
            data: result 
          };
        } else {
          return { 
            success: false, 
            error: result.message || "Failed to create XpressBees NDR"
          };
        }
      } else {
        return { 
          success: false, 
          error: "Invalid response format from XpressBees API"
        };
      }
      
    } catch (apiError) {
      if (axios.isAxiosError(apiError) && apiError.response) {
        console.error("XpressBees API Error:", {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data
        });

        if (Array.isArray(apiError.response.data) && apiError.response.data.length > 0) {
          const result = apiError.response.data[0];
          return { 
            success: false, 
            error: result.message || "XpressBees API error" 
          };
        }

        const errorMessage = apiError.response.data?.message || 
                            apiError.response.data?.error || 
                            "Error from XpressBees API";
        
        return { success: false, error: errorMessage };
      }
      
      if (apiError instanceof Error) {
        return { success: false, error: apiError.message };
      }
      
      return { success: false, error: "Unknown error occurred while creating XpressBees NDR" };
    }
    
  } catch (error) {
    console.error("Error in createXpressbeesNdr:", error);
    
    if (axios.isAxiosError(error) && error.response) {

      if (Array.isArray(error.response.data) && error.response.data.length > 0) {
        const result = error.response.data[0];
        return { 
          success: false, 
          error: result.message || "XpressBees API error" 
        };
      }
      
      return { 
        success: false, 
        error: error.response.data?.message || 'Unknown API error'
      };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return {
      success: false,
      error: "An unexpected error occurred while creating XpressBees NDR request"
    };
  }
}