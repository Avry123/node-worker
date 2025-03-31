"use server";

import axios from "axios";
import { OrderStatus, Prisma } from "@prisma/client";
// import { revalidatePath } from "next/cache";
// import { getDeliveryPartnerId } from "../orders"
import { getDeliveryPartnerToken } from "./tokenManager";
import prisma from "../../lib/prisma";




export async function createEkartOrder(orderId: number) {
  function generateTrackingId(isPrepaid: boolean): string {
    // Format: 3 char merchant code (SHY) + C/P + 10 digits
    const merchantCode = "SHY";
    const paymentType = isPrepaid ? "P" : "C";

    // Generate a unique 10-digit number using timestamp and order ID
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const orderPart = orderId.toString().padStart(4, "0").slice(-4); // Last 4 digits of order ID

    // Combine to create the 10-digit unique number
    const uniqueNumber = (orderPart + timestamp).slice(-10).padStart(10, "0");

    // Combine all parts: SHY + C/P + 10 digits = 14 characters total
    return `${merchantCode}${paymentType}${uniqueNumber}`;
  }

  try {
    const token = await getDeliveryPartnerToken("ekart");

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

    if (!warehouseAddress) {
      console.error("Warehouse address not found");
      return { success: false, error: "Warehouse address not found" };
    }

    const customerAddress = order.customerAddress;
    if (!customerAddress) {
      console.error("Customer address not found");
      return { success: false, error: "Customer address not found" };
    }

    const safeToNumber = (value: Prisma.Decimal | null | undefined): number => {
      return value ? value.toNumber() : 0;
    };

    const requestBody = {
      client_name: "SHY",
      services: [
        {
          service_code: "Regular",
          service_details: [
            {
              service_leg: "FORWARD",
              service_data: {
                vendor_name: "Ekart",
                amount_to_collect: order.paymentMode?.toLowerCase() === "cod"?order.totalOrderValue: 0,
                delivery_type: "SMALL",
                source: {
                  address: {
                    first_name: order?.Users?.StoreName || warehouseAddress.tag,
                    address_line1: warehouseAddress.address,
                    pincode: warehouseAddress.pincode.toString(),
                    city: warehouseAddress.city,
                    state: warehouseAddress.state,
                    primary_contact_number: warehouseAddress.contactNumber,
                    email_id: warehouseAddress.email,
                  },
                },
                destination: {
                  address: {
                    first_name: customerAddress.fullName,
                    address_line1: customerAddress.address,
                    pincode: customerAddress.pincode.toString(),
                    city: customerAddress.city,
                    state: customerAddress.state,
                    primary_contact_number: customerAddress.contactNumber,
                  },
                },
                return_location: {
                  address: {
                    first_name: order?.Users?.StoreName || warehouseAddress.tag,
                    address_line1: warehouseAddress.address,
                    pincode: warehouseAddress.pincode.toString(),
                    city: warehouseAddress.city,
                    state: warehouseAddress.state,
                    primary_contact_number: warehouseAddress.contactNumber,
                    email_id: warehouseAddress.email,
                  },
                },
              },
              shipment: {
                tracking_id: generateTrackingId(
                  order.paymentMode?.toLowerCase() === "prepaid",
                ),
                shipment_value: safeToNumber(order.totalOrderValue),
                shipment_dimensions: {
                  length: {
                    value: safeToNumber(order.length),
                  },
                  breadth: {
                    value: safeToNumber(order.breadth),
                  },
                  height: {
                    value: safeToNumber(order.height),
                  },
                  weight: {
                    value: safeToNumber(order.applicableWeight),
                  },
                },
                shipment_items: [
                  {
                    quantity: order.Packages.length,
                    seller_details: {
                      seller_reg_name:
                        order?.Users?.StoreName || warehouseAddress.tag,
                    },
                    item_attributes: [
                      {
                        name: "order_id",
                        value: order.orderId.toString(),
                      },
                      {
                        name: "invoice_id",
                        value: order.totalOrderValue,
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const response = await axios.post(
      "https://api.ekartlogistics.com/v2/shipments/create",
      requestBody,
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
          HTTP_X_MERCHANT_CODE: "SHY",
        },
      },
    );
    console.log(JSON.stringify(requestBody), "requestBody for ekart");
    //console.log('hi' , response.data.response[0].tracking_id)
    if (response.data.response[0].status === "REQUEST_RECEIVED") {
      const result = await prisma.$transaction(async (prismaTransaction) => {
        const updatedOrder = await prismaTransaction.orders.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.READY_TO_SHIP,
            awbNumber: response.data.response[0].tracking_id,
            shippingDate: new Date(),
          },
        });

        return updatedOrder;
      });

      // revalidatePath("/orders");

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
        awbNumber: response.data.response[0].tracking_id,
      };
    } else {
      console.error("Failed to create order with Ekart");
    }
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          message: "Error in createEkartOrder:",
          errorDetails: error,
          path: "deliverypartner/ekart",
        },
        null,
        2,
      ),
    );

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function CancelEkartOrder(awbNumber: string) {
  try {
    const token = await getDeliveryPartnerToken("ekart");
    console.log("Line 222 ", token);

    const requestBody = {
      request_details: [
        {
          tracking_id: awbNumber,
        },
      ],
    };

    const response: any = await axios.put(
      "https://api.ekartlogistics.com/v2/shipments/rto/create",
      requestBody,
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
          HTTP_X_MERCHANT_CODE: "SHY",
        },
      },
    );

    console.log(JSON.stringify("Order cancellation response:", response.data));
    if (
      (response.data.reason = response.data.response[0].status_code === 200)
    ) {
      return { success: true, message: "Order was successfully canceled" };
    }

    return { success: false, message: "Order cancellation failed" };
  } catch (error: any) {
    console.error(
      JSON.stringify({
        message: "Error cancelling Ekart order:",
        errorDetails: error,
        path: "deliverypartner/ekart",
      }),
    );

    if (error.response && error.response.data) {
      console.error(
        JSON.stringify({
          message: "Error response data:",
          errorDetails: error.response.data,
          path: "deliverypartner/ekart",
        }),
      );
    }
    console.error("Failed to cancel Ekart order");
  }
}

function generateRandomOrderId(orderId: any) {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${orderId}-${randomNum}`;
}

export async function createReverseEkartOrder(orderId: number) {
  function generateTrackingId(isPrepaid: boolean): string {
    // Format: 3 char merchant code (SHY) + C/P + 10 digits
    const merchantCode = "SHY";
    const paymentType = isPrepaid ? "P" : "C";

    // Generate a unique 10-digit number using timestamp and order ID
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const orderPart = orderId.toString().padStart(4, "0").slice(-4); // Last 4 digits of order ID

    // Combine to create the 10-digit unique number
    const uniqueNumber = (orderPart + timestamp).slice(-10).padStart(10, "0");

    // Combine all parts: SHY + C/P + 10 digits = 14 characters total
    return `${merchantCode}${paymentType}${uniqueNumber}`;
  }
  try {
    const token = await getDeliveryPartnerToken("ekart");

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        Packages: true,
        ReversePickupAddress: true,
        reverseCustomerAddress: true,
        Users: true,
      },
    });

    if (!order) {
      console.error("Order not found");
      return { success: false, error: "Order not found" };
    }

    const pickupAddress = order.ReversePickupAddress;
    if (!pickupAddress) {
      console.error("Pickup address not found");
      return { success: false, error: "Pickup address not found" };
    }

    const customerAddress = order.reverseCustomerAddress;
    if (!customerAddress) {
      console.error("Customer address not found");
      return { success: false, error: "Customer address not found" };
    }

    const safeToNumber = (value: Prisma.Decimal | null | undefined): number => {
      return value ? value.toNumber() : 0;
    };

    const requestBody = {
      client_name: "SHY",
      goods_category: "ESSENTIAL",
      services: [
        {
          service_code: "RETURNS_BASIC_CHECK",
          service_details: [
            {
              service_leg: "REVERSE",
              service_data: {
                amount_to_collect: 0,
                delivery_type: "SMALL",
                source: {
                  address: {
                    first_name: pickupAddress.fullName,
                    address_line1: pickupAddress.address,
                    address_line2: pickupAddress.landmark,
                    pincode: pickupAddress.pincode,
                    city: pickupAddress.city,
                    state: pickupAddress.state,
                    primary_contact_number: pickupAddress.contactNumber,
                  },
                },
                destination: {
                  address: {
                    first_name: order?.Users?.StoreName || customerAddress.tag,
                    address_line1: customerAddress.address,
                    address_line2: customerAddress.landmark,
                    pincode: customerAddress.pincode,
                    city: customerAddress.city,
                    state: customerAddress.state,
                    primary_contact_number: customerAddress.contactNumber,
                  },
                },
              },
              shipment: {
                tracking_id: generateTrackingId(
                  order.paymentMode?.toLowerCase() === "prepaid",
                ),
                shipment_value: safeToNumber(order.totalOrderValue),
                shipment_dimensions: {
                  length: {
                    value: safeToNumber(order.length),
                  },
                  breadth: {
                    value: safeToNumber(order.breadth),
                  },
                  height: {
                    value: safeToNumber(order.height),
                  },
                  weight: {
                    value: safeToNumber(order.applicableWeight),
                  },
                },
                shipment_items: [
                  {
                    quantity: order.Packages.length,
                    seller_details: {
                      seller_reg_name: pickupAddress.fullName,
                    },
                    item_attributes: [
                      {
                        name: "order_id",
                        value: generateRandomOrderId(order.orderId),
                      },
                      {
                        name: "invoice_id",
                        value: "34543",
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const response = await axios.post(
      "https://api.ekartlogistics.com/v2/shipments/create ",
      requestBody,
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
          HTTP_X_MERCHANT_CODE: "SHY",
        },
      },
    );

    if (response.data.response[0].status === "REQUEST_RECEIVED") {
      const result = await prisma.$transaction(async (prismaTransaction) => {
        const updatedOrder = await prismaTransaction.orders.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.READY_TO_SHIP,
            awbNumber: response.data.response[0].tracking_id,
            shippingDate: new Date(),
          },
        });

        return updatedOrder;
      });

      // revalidatePath("/orders");

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
        awbNumber: response.data.response[0].tracking_id,
      };
    } else {
      console.error(
        JSON.stringify({
          message: `Failed to create order with Ekart: ${response.data.response[0].message[0]}`,
          path: "deliverypartner/ekart",
        }),
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          message: "Error in createReverseEkartOrder:",
          errorDetails: error,
          path: "deliverypartner/ekart",
        },
        null,
        2,
      ),
    );

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function CancelReverseEkartOrder(awbNumber: string) {
  try {
    const token = await getDeliveryPartnerToken("ekart");
    //    console.log("Line 222 ", token);

    const requestBody = {
      request_details: [
        {
          tracking_id: awbNumber,
        },
      ],
    };

    const response: any = await axios.put(
      "https://api.ekartlogistics.com/v2/shipments/rvp/cancel",
      requestBody,
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
          HTTP_X_MERCHANT_CODE: "SHY",
        },
      },
    );

    //   console.log("Order cancellation response:", response.data);
    if (response.data.response[0].status_code === 200) {
      return { success: true, message: "Order was successfully canceled" };
    }

    return { success: false, message: "Order cancellation failed" };
  } catch (error: any) {
    console.error(
      JSON.stringify({
        message: "Error in cancel reverse for ekart:",
        errorDetails: error,
        path: "deliverypartner/ekart",
      }),
    );

    if (error.response && error.response.data) {
      console.error(
        JSON.stringify({
          message: "Error response data:",
          errorDetails: error.response.data,
          path: "deliverypartner/ekart",
        }),
      );
    }
    return { success: false, message: " Ekart Order cancellation failed" };
  }
}

export async function createEkartNdr(order: any, data: any) {
  console.log("Starting createEkartNdr for order:", order);
  console.log("Data:", data);
  
  try {
    const token = await getDeliveryPartnerToken("ekart");
    const orders = await prisma.orders.findUnique({
      where: { orderId: Number(order.orderId) },
      include: {
        customerAddress: true,
      },
    });;
    
    if (!orders) {
      return { success: false, error: "Order not found" };
    }

    if (data.address || data.phone) {
      const updateResult = await updateCustomerDetails(orders, data, token);
      if (!updateResult.success) {
        return updateResult;
      }
    }
    
    const rescheduleResult = await rescheduleDelivery(order.awbNumber, token);
    if (!rescheduleResult.success) {
      return rescheduleResult;
    }
    
    if (data.address || data.phone) {
      await updateCustomerAddressInDb(orders, data);
    }
    
    return { 
      success: true, 
      message: "NDR request processed successfully" 
    };
  } catch (error) {
    return handleApiError(error, "createEkartNdr");
  }
}





async function updateCustomerDetails(orders: any, data: any, token: string) {
  let updateRequestType = "";
  let updateRequestDetails: any = {};
  
  if (data.phone && !data.address) {
    updateRequestType = "CUSTOMER_CONTACT";
    updateRequestDetails = {
      customer_address: {
        primary_contact_number: data.phone
      }
    };
  } else {
    updateRequestType = "CUSTOMER_DETAILS";
    updateRequestDetails = {
      customer_address: {
        address_line1: data.address || "",
        city: orders?.customerAddress?.city || "",
        state: orders?.customerAddress?.state || "",
        pincode: orders?.customerAddress?.pincode || "",
        primary_contact_number: data.phone || orders?.customerAddress?.contactNumber || ""
      }
    };
  }
  
  const requestBody = {
    update_request_type: updateRequestType,
    update_request_details: updateRequestDetails,
    tracking_id: orders.awbNumber
  };
  
  console.log("Request body for Ekart customer details update:", requestBody);
  
  try {
    const response = await axios.put(
      "https://api.ekartlogistics.com/v2/shipments/update_shipment",
      requestBody,
      {
        headers: getEkartHeaders(token),
      }
    );
    
    console.log("Response from Ekart (customer details update):", JSON.stringify(response.data));
    
    return parseEkartResponse(response.data, updateRequestType);
  } catch (error) {
    return handleApiError(error, "updateCustomerDetails");
  }
}

async function rescheduleDelivery(awbNumber: string, token: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = tomorrow.toISOString().split('T')[0];
  
  const updateRequestDetails = {
    updated_delivery_date: formattedDate
  };
  
  const requestBody = {
    update_request_type: "RESCHEDULE_DELIVERY_DATE",
    update_request_details: updateRequestDetails,
    tracking_id: awbNumber
  };
  
  console.log("Request body for Ekart delivery reschedule:", requestBody);
  
  try {
    const response = await axios.put(
      "https://api.ekartlogistics.com/v2/shipments/update_shipment",
      requestBody,
      {
        headers: getEkartHeaders(token),
      }
    );
    
    console.log("Response from Ekart (reschedule delivery):", JSON.stringify(response.data));
    console.log("NDR Response from Ekart reattempt:", response.data);
    
    return parseEkartResponse(response.data, "RESCHEDULE_DELIVERY_DATE");
  } catch (error) {
    return handleApiError(error, "rescheduleDelivery");
  }
}

async function updateCustomerAddressInDb(orders: any, data: any) {
  try {
    const customerId = orders.forwardCustomerId || orders.reverseCustomerId;
    
    if (!customerId) {
      console.log("No valid customer ID found for address update");
      return;
    }
    
    console.log(`Updating ${orders.forwardCustomerId ? "forward" : "reverse"} customer address`);
    
    await prisma.customerAddress.update({
      where: {
        customerId,
      },
      data: {
        address: data.address || undefined,
        contactNumber: data.phone || undefined,
      },
    });
  } catch (dbError) {
    console.error("Error updating customer address:", dbError);

  }
}

function getEkartHeaders(token: string) {
  return {
    Authorization: `${token}`,
    HTTP_X_MERCHANT_CODE: "SHY",
  };
}

function parseEkartResponse(responseData: any, requestType: string) {
  // Check for success conditions
  if (
    (responseData?.response?.[0]?.status_code === 200) ||
    (responseData?.success === true) ||
    (responseData?.status === "SUCCESS")
  ) {
    return { 
      success: true, 
      message: `Operation successful for ${requestType}` 
    };
  }
  
  // Check for specific error responses in array format
  if (Array.isArray(responseData?.response)) {
    const failedRequests = responseData.response.filter((item: any) => 
      item.status === "REQUEST_REJECTED" || item.status === "FAILED"
    );
    
    if (failedRequests.length > 0) {
      const errorItem = failedRequests[0];
      const errorMessages = Array.isArray(errorItem.message) 
        ? errorItem.message.join(", ") 
        : errorItem.message || "Request rejected";
        
      return {
        success: false,
        error: `${errorItem.status}: ${errorMessages}`
      };
    }
  }
  
  // Default error response
  return { 
    success: false, 
    error: responseData?.message || responseData?.error || `Failed to process ${requestType} request` 
  };
}

function handleApiError(error: any, source: string) {
  if (axios.isAxiosError(error) && error.response) {
    console.error(`Error in ${source}:`, {
      status: error.response.status,
      statusText: error.response.statusText,
      data: JSON.stringify(error.response.data)
    });
    
    // Try to parse the error response if it's a string
    let errorData: any;
    if (typeof error.response.data === 'string') {
      try {
        errorData = JSON.parse(error.response.data);
      } catch (e) {
        errorData = { message: error.response.data };
      }
    } else {
      errorData = error.response.data;
    }
    
    // Extract error message from the response array structure
    if (Array.isArray(errorData?.response)) {
      const failedItem = errorData.response.find((item: any) => 
        item.status === "REQUEST_REJECTED" || item.status === "FAILED"
      );
      
      if (failedItem) {
        const errorMessages = Array.isArray(failedItem.message) 
          ? failedItem.message.join(", ") 
          : failedItem.message || "Request rejected";
          
        return {
          success: false,
          error: `${failedItem.status}: ${errorMessages}`
        };
      }
    }
    
    const errorMessage = errorData?.message || 
                         errorData?.error || 
                         errorData?.details ||
                         "Error from Ekart API";
    
    return { 
      success: false, 
      error: `Ekart API error: ${errorMessage} (${error.response.status})` 
    };
  }
  
  if (error instanceof Error) {
    console.error(`Error in ${source}:`, error);
    return { success: false, error: error.message };
  }
  
  console.error(`Unexpected error in ${source}:`, error);
  return {
    success: false,
    error: `An unexpected error occurred in ${source}`
  };
}

export async function createEkartRto(order: any, data: any) {
  try {
    const token = await getDeliveryPartnerToken("ekart");
    console.log("inside createEkartRto ", token);

    const requestBody = {
      request_details: [
        {
          tracking_id: order.awbNumber,
        },
      ],
    };

    console.log("Request Body for ekart rto:", requestBody);

    const response: any = await axios.put(
      "https://api.ekartlogistics.com/v2/shipments/rto/create",
      requestBody,
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
          HTTP_X_MERCHANT_CODE: "SHY",
        },
      },
    );

    console.log(JSON.stringify("Order cancellation response:", response.data));
    if (
      (response.data.reason = response.data.response[0].status_code === 200)
    ) {
      return { success: true, message: "Order was successfully canceled" };
    }

    return { success: false, message: "Order cancellation failed" };
  } catch (error: any) {
    console.error(
      JSON.stringify({
        message: "Error cancelling Ekart order:",
        errorDetails: error,
        path: "deliverypartner/ekart",
      }),
    );

    if (error.response && error.response.data) {
      console.error(
        JSON.stringify({
          message: "Error response data:",
          errorDetails: error.response.data,
          path: "deliverypartner/ekart",
        }),
      );
    }
    console.error("Failed to RTO Ekart order");
  }
}