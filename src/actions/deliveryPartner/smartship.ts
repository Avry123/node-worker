"use server";

import axios from "axios";

import { getDeliveryPartnerToken } from "./tokenManager";
import prisma from "../../lib/prisma";
import { OrderStatus } from "@prisma/client";



interface hubDetails {}

async function registerSmartshipHub(
  order : any,
  warehouseAddress : any,
  token : any,
  shypmentType : any,
): Promise<{ success: boolean; hubId?: string; error?: string }> {
  try {
    // Validate required fields
    if (!warehouseAddress) {
      return { success: false, error: "Warehouse address is required" };
    }

    // Phone number validation
    const phoneNumber = warehouseAddress.contactNumber?.replace(/\D/g, "");
    if (!phoneNumber || phoneNumber.length !== 10) {
      return {
        success: false,
        error: "Invalid phone number. Please provide a 10-digit phone number.",
      };
    }

    // const  deliveryTypeId = order.applicableWeight
    //   ? Number(order.applicableWeight) > 5
    //     ? 3
    //     : 2
    //   : 2;
    let deliveryTypeId;
    if (order.applicableWeight) {
      if (Number(order.applicableWeight) > 5) {
        deliveryTypeId = 3;
      } else {
        if (shypmentType === "air") {
          deliveryTypeId = 1;
        } else {
          deliveryTypeId = 2;
        }
      }
    }

    const requestBody = {
      hub_details: {
        hub_name: order.Users?.StoreName || warehouseAddress.tag || "",
        pincode: warehouseAddress.pincode || "",
        city: warehouseAddress.city || "",
        state: warehouseAddress.state || "",
        address1: warehouseAddress.address || "",
        hub_phone: phoneNumber,
        delivery_type_id: deliveryTypeId,
      },
    };
    console.log(
      shypmentType,
      "requestBody",
      requestBody.hub_details.delivery_type_id,
    );
    const hubDetails = await fetch(
      "https://api.smartship.in/v2/app/Fulfillmentservice/hubRegistration",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!hubDetails.ok) {
      console.error(`API request failed with status ${hubDetails.status}`);
      return {
        success: false,
        error: "Hub registration failed",
      };
    }

    const hub = await hubDetails.json();

    // Handle validation errors
    if (hub.data?.message?.validation_error) {
      return {
        success: false,
        error: Array.isArray(hub.data.message.validation_error)
          ? hub.data.message.validation_error.join(", ")
          : hub.data.message.info || "Validation error occurred",
      };
    }

    // Extract hub ID based on response format
    const hubId =
      hub.message === "OK"
        ? hub.data?.message?.registered_hub_id
        : hub.data?.hub_id;

    if (!hubId) {
      return {
        success: false,
        error: "Failed to get hub ID from response",
      };
    }

    return {
      success: true,
      hubId,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        errorDetails: error,
        path: "deliveryPartner/smartship/hubRegistration",
      }),
    );

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

interface SmartShipOrderResponse {
  status: number;
  code: number;
  message: string;
  data: {
    success_order_details: {
      orders: Array<{
        carrier_name: string;
        awb_number: string | boolean;
        message: string;
        client_order_reference_id: string;
        route_code: string;
      }>;
    };
    errors?: {
      data_discrepancy?: Array<{
        error: string[];
      }>;
    };
  };
}

export async function createSmartshipOrder(
  orderId: number,
  shypmentType: string,
) {
  const token = await getDeliveryPartnerToken("smartship");
  const reference_id = orderId + Math.floor(Math.random() * 1000).toString();


  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    include: {
      PickUpAddress: true,
      customerAddress: true,
      Packages: true,
      Users: { select: { StoreName: true } },
    },
  });

  if (!order?.agentAddressId) {
    return { success: false, error: "Agent address not found" };
  }

  const warehouseAddress = await prisma.address.findUnique({
    where: { id: order.agentAddressId },
  });

  try {
    const hubResult = await registerSmartshipHub(
      order,
      warehouseAddress,
      token,
      shypmentType,
    );
    if (!hubResult.success) {
      return { success: false, error: hubResult.error };
    }

    const hubId = hubResult.hubId;
    const collectableAmount =
      order.paymentMode?.toLowerCase() === "prepaid"
        ? 0
        : order.totalOrderValue;

    // if (shypmentType === "air") {
    //   //  http://api.smartship.in/v2/app/Fulfillmentservice/CarrierServiceablePincodes
    //   const createOrder = await fetch(
    //     "http://api.smartship.in/v2/app/Fulfillmentservice/CarrierServiceablePincodes",
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: token,
    //       },
    //       body: JSON.stringify({
    //         carrier_info: {
    //           payment_type: "",
    //           carrier_id: ["282"],
    //         },
    //       }),
    //     },
    //   );
    //   const abc = await createOrder.json();
    //   console.log("shypmentType is air and response is ",abc.data[282].valid_pincode);
    // }

    const requestBody = {
      request_info: {
        client_id: "7W1XHVLE2R75AVYI3IBS7C5KO9SV7M",
        run_type: "create",
        shipment_type: 1,
      },
      orders: [
        {
          client_order_reference_id: reference_id,
          order_collectable_amount: collectableAmount,
          total_order_value: order.totalOrderValue,
          payment_type: order.paymentMode,
          package_order_weight: (
            Number(order.applicableWeight) * 1000
          ).toString(),
          package_order_length: order.length,
          package_order_height: order.height,
          package_order_width: order.breadth,
          shipper_hub_id: hubId,
          order_invoice_number: "INV001",
          order_invoice_date: new Date(),
          order_meta: {
            preferred_carriers: [shypmentType === "surface" ? 279 : 282],
          },
          product_details: order.Packages.map((item) => ({
            client_product_reference_id: item.PackageId.toString(),
            product_name: item.productName,
            product_category: item.category,
            product_quantity: item.quantity,
            product_invoice_value: item.price,
            product_gst_tax_rate: 18,
          })),
          consignee_details: {
            consignee_name: order.customerAddress?.fullName,
            consignee_phone: order.customerAddress?.contactNumber,
            consignee_email: order.customerAddress?.email,
            consignee_complete_address: order.customerAddress?.address,
            consignee_pincode: order.customerAddress?.pincode,
          },
        },
      ],
    };

    console.log(hubId, "shypmentType");
    const createOrder = await fetch(
      "https://api.smartship.in/v2/app/Fulfillmentservice/orderRegistrationOneStep",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(requestBody),
      },
    );

    console.log(requestBody, "requestBody for smartship");

    if (!createOrder.ok) {
      return { success: false, error: "Failed to create order" };
    }

    const data: SmartShipOrderResponse = await createOrder.json();

    // Log error details if present
    if (data.data?.errors?.data_discrepancy) {
      console.error(
        JSON.stringify({
          errorDetails: data.data.errors.data_discrepancy,
          path: "deliveryPartner/smartship",
        }),
      );
      return {
        success: false,
        error: data.data.errors.data_discrepancy[0]?.error[0],
      };
    }

    // Check for NSS carrier
    const orderDetails = data?.data?.success_order_details?.orders[0];
    console.log(" line 158 of smartship", orderDetails);
    if (orderDetails?.carrier_name == "NSS") {
      return {
        success: false,
        error: "Pincode not serviceable",
        message: "The delivery location is not serviceable",
      };
    }

    // Handle AWB number false case
    if (orderDetails?.awb_number === false) {
      return {
        success: false,
        error: "Pincode not serviceable",
        message: "The delivery location is not serviceable",
      };
    }

    // Update order with AWB number
    await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.READY_TO_SHIP,
        awbNumber: orderDetails.awb_number as string,
        responseOrderId: reference_id,
        SS_Delivery_Code: orderDetails.route_code,
        shippingDate: new Date(),
      },
    });

    return {
      success: true,
      awbNumber: orderDetails.awb_number,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        errorDetails: error,
        path: "deliveryPartner/smartship",
      }),
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function cancelSmartship(
  responseId: string | undefined,
  awbNumber: string,
) {
  const token = await getDeliveryPartnerToken("smartship");

  // console.log(responseId, " this is the responseId");

  const response = await fetch(
    "https://api.smartship.in/v2/app/Fulfillmentservice/orderCancellation",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        orders: {
          client_order_reference_ids: {
            responseId,
          },
        },
      }),
    },
  );

  if (response.ok) {
    const data = await response.json();
    // console.log(data, " line 233 of cancel smartship");

    console.error(
      JSON.stringify({
        errorDetails: data.data.order_cancellation_details?.successful,
        path: "deliveryPartner/smartship",
      }),
    );

    return { success: true, message: "Order cancelled successfully" };
  } else {
    return { success: false, message: "Order cancellation unsuccessfully" };
  }
}


export async function createSmartshipNdr(order: any, data: any, action:string) {
  console.log("Starting createSmartshipNdr for orderId:", order.orderId);
  console.log("Data:", data);
  
  try {
    const token = await getDeliveryPartnerToken("smartship");
    
    const orders = await prisma.orders.findUnique({
      where: { orderId: Number(order.orderId) },
      include: {
        customerAddress: true,
        
      },
    });
    
    if (!orders) {
      return { success: false, error: "Order not found" };
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0]; 
    
    const nextAttemptDate = formattedDate;

 
    
    const requestBody = {
      orders: [
        {

          client_order_reference_id: [orders.responseOrderId],
          action_id: action == "ndr"?"1":"2", 
          comments: action == "ndr"? "Reattempt requested" :"RTO Requested",
          next_attempt_date:  action == "ndr"? nextAttemptDate:"",
          address: data?.address || orders.customerAddress?.address || "",
          phone: data?.phone || orders.customerAddress?.contactNumber || "",
          names: orders.customerAddress?.fullName || "",
          alternate_address:orders.customerAddress?.address  || "",
          alternate_number: orders.customerAddress?.contactNumber || ""
        }
      ]
    };
    
    console.log("Smartship NDR request body:", JSON.stringify(requestBody));
    
    try {
      const response = await axios.post(
        "http://api.smartship.in/v2/app/Fulfillmentservice/orderReattempt",
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("Smartship NDR Response:", JSON.stringify(response.data));

      if (response.data && response.data.status === 1 && response.data.code === 200) {

        if (response.data.data && 
            response.data.data.success_orders && 
            response.data.data.success_orders.length > 0) {

          if (data.address || data.phone) {
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
            message: "Smartship NDR reattempt created successfully",
            data: response.data.data.success_orders[0]
          };
        } else if (response.data.data && 
                  response.data.data.errors && 
                  response.data.data.errors.length > 0) {

          const errorData = response.data.data.errors[0];
          return { 
            success: false, 
            error: errorData.error || "Failed to create Smartship NDR"
          };
        }
      }

      return { 
        success: false, 
        error: response.data?.message || "Invalid response format from Smartship API"
      };
      
    } catch (apiError) {
      if (axios.isAxiosError(apiError) && apiError.response) {
        console.error("Smartship API Error:", {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data
        });

        if (apiError.response.data?.data?.errors && 
            apiError.response.data.data.errors.length > 0) {
          const errorDetail = apiError.response.data.data.errors[0];
          return { 
            success: false, 
            error: errorDetail.error || "API error"
          };
        }
        
        const errorMessage = apiError.response.data?.message || 
                            apiError.response.data?.error || 
                            "Error from Smartship API";
        
        return { success: false, error: errorMessage };
      }
      
      if (apiError instanceof Error) {
        return { success: false, error: apiError.message };
      }
      
      return { success: false, error: "Unknown error occurred while creating Smartship NDR" };
    }
    
  } catch (error) {
    console.error("Error in createSmartshipNdr:", error);
    
    if (axios.isAxiosError(error) && error.response) {

      if (error.response.data?.data?.errors && 
          error.response.data.data.errors.length > 0) {
        const errorDetail = error.response.data.data.errors[0];
        return { 
          success: false, 
          error: errorDetail.error || error.response.data?.message || 'API error'
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
      error: "An unexpected error occurred while creating Smartship NDR request"
    };
  }
}