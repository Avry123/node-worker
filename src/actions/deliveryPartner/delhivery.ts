"use server";

import axios from "axios";

import {

  Orders,
  OrderStatus,
  Prisma,

} from "@prisma/client";

// import DeliveryPartnerModal from "@/components/UserAdmin/testing/DeliveryPartnerModal";
import { getDeliveryPartnerToken } from "./tokenManager";
import prisma from "../../lib/prisma";



interface WarehouseDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  pin: string;
  return_address: string;
  return_pin: string;
  return_city: string;
  return_state: string;
  return_country: string;
}

type CreateDelhiveryReverseOrderResult = {
  success: boolean;
  order?: Orders;
  awbNumber?: string;
  error?: string;
};

let token: string;

async function getToken(type: string): Promise<string> {
  console.log("Getting token for type:", type);

  try {
    switch (type.toLowerCase()) {
      case "delhivery":
        token = await getDeliveryPartnerToken("Delhivery");
        break;
      case "delhivery 5kg":
        token = await getDeliveryPartnerToken("Delhivery5kg");
        break;
      case "delhivery 10kg":
        token = await getDeliveryPartnerToken("Delhivery10kg");
        break;
      case "delhivery 20kg":
        token = await getDeliveryPartnerToken("Delhivery20kg");
        break;
      case "delhivery air":
        token = await getDeliveryPartnerToken("DelhiveryAir");
        break;
      case "delhivery reverse":
        token = await getDeliveryPartnerToken("Delhivery");
        break;
      default:
        console.error(`No token found for type: ${type} `);
    }

    if (!token) {
      console.error(`Token is undefined for type: ${type}`);
    }

    console.log(
      "Token successfully retrieved:",
      token.substring(0, 10) + "...",
    );
    return token;
  } catch (error) {
    console.error("Error in getToken:", error);
    return error instanceof Error ? error.message : String(error);
  }
}

function generateRandomOrderId(orderId: any) {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${orderId}-${randomNum}`;
}

export async function cancelDelhiveryOrder(awbNumber: string, type: string) {
  try {
    console.log("awbNumber line no. 232:", awbNumber);

    const token = await getToken(type);

    const data = {
      waybill: awbNumber,
      cancellation: true,
    };

    const jsonData = JSON.stringify(data);
    const requestBody = jsonData;

    const response = await axios.post(
      "https://track.delhivery.com/api/p/edit",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${token}`,
        },
      },
    );

    console.log(
      "Cancellation Response from Delhivery line 254:",
      response.data,
    );

    if (response.data.status === true) {
      const order = await prisma.orders.findUnique({
        where: { awbNumber: awbNumber },
      });

      if (!order) {
        console.error(
          `Order with AWB number ${awbNumber} not found in the database.`,
        );
        return { success: false, message: "Order not found in the database" };
      }

      console.log(
        `Order with AWB number ${awbNumber} has been successfully cancelled.`,
      );

      // revalidateTag('orders');

      return { success: true, message: "Order cancelled successfully" };
    } else {
      console.error("Failed to cancel order:", response.status);
      return { success: false, message: "Order cancellation unsuccessfully" };
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function createDelhiveryOrder(
  orderId: number,
  mode: string,
  type: string,
) {
  try {
    console.log("Starting createDelhiveryOrder for orderId:", orderId);
    const token = await getToken(type);
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
      console.error(`Order not found for orderId: ${orderId}`);
      return { success: false, message: "Order not found" };
    }

    const warehouseAddress = await prisma.address.findUnique({
      where: { id: order.agentAddressId ?? undefined },
    });

    const rtoWarehouseAddress = await prisma.address.findUnique({
      where: { id: order.rtoAgentAddressId ?? undefined },
    });

    if (!warehouseAddress || !rtoWarehouseAddress) {
      console.error("Warehouse address or RTO warehouse address not found");
      return { success: false, message: "Warehouse address not found" };
    }

    const warehouseDetails: WarehouseDetails = {
      name: warehouseAddress.tag,
      email: warehouseAddress.email || "default@example.com",
      phone: warehouseAddress.contactNumber,
      address: warehouseAddress.address,
      city: warehouseAddress.city,
      country: "India",
      pin: warehouseAddress.pincode.toString(),
      return_address: rtoWarehouseAddress.address,
      return_pin: rtoWarehouseAddress.pincode.toString(),
      return_city: rtoWarehouseAddress.city,
      return_state: rtoWarehouseAddress.state,
      return_country: "India",
    };

    try {
      const warehouseResponse = await axios.post(
        "https://track.delhivery.com/api/backend/clientwarehouse/create/",
        warehouseDetails,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Token ${token}`,
          },
        },
      );

      if (warehouseResponse.data.success) {
        console.log("Warehouse creation successful");
      } else {
        if (
          warehouseResponse.data.error &&
          warehouseResponse.data.error[0]?.includes("already exists")
        ) {
          console.log("Warehouse already exists");
        } else {
          console.error(
            "Failed to create warehouse:",
            warehouseResponse.data.error,
          );
        }
      }
    } catch (warehouseError) {
      console.warn(
        "Warehouse creation failed, proceeding with existing warehouse:",
        warehouseError,
      );
    }

    const shipmentData = {
      shipments: [
        {
          name: order.customerAddress?.fullName ?? "",
          add: order.customerAddress?.address ?? "",
          pin: order.customerAddress?.pincode?.toString() ?? "",
          city: order.customerAddress?.city ?? "",
          state: order.customerAddress?.state ?? "",
          country: "India",
          phone: order.customerAddress?.contactNumber ?? "",
          order: generateRandomOrderId(order.orderId),
          payment_mode: order.paymentMode?.toUpperCase() || "",
          return_pin: rtoWarehouseAddress?.pincode?.toString() ?? "",
          return_city: rtoWarehouseAddress?.city ?? "",
          return_phone: rtoWarehouseAddress?.contactNumber ?? "",
          return_add: rtoWarehouseAddress?.address ?? "",
          return_state: rtoWarehouseAddress?.state ?? "",
          return_country: "India",
          products_desc: "",
          cod_amount:
            order.paymentMode?.toLowerCase() === "cod"
              ? order.totalOrderValue?.toString() ?? "0"
              : "0",
          total_amount: order.totalOrderValue?.toString() ?? "0",
          seller_add: warehouseAddress.address,
          seller_name: order?.Users?.StoreName || warehouseAddress.tag,
          shipment_width: order.breadth?.toString() || "",
          shipment_height: order.height?.toString() || "",
          weight: order.applicableWeight?.toString() || "",
          shipping_mode: mode === "surface" ? "Surface" : "Express",
        },
      ],
      pickup_location: {
        name: warehouseAddress.tag,
        add: warehouseAddress.address,
        city: warehouseAddress.city,
        pin_code: warehouseAddress.pincode,
        country: "India",
        phone: warehouseAddress.contactNumber,
      },
    };

    console.log(shipmentData);

    const jsonData = JSON.stringify(shipmentData);
    const requestBody = `format=json&data=${encodeURIComponent(jsonData)}`;

    const response = await axios.post(
      "https://track.delhivery.com/api/cmu/create.json",
      requestBody,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Token ${token}`,
        },
      },
    );

    console.log(JSON.stringify(requestBody), "requestBody for delhivery");

    console.log(
      JSON.stringify(
        {
          message: "Delhivery API response:",
          responseData: response.data,
          path: "deliveryPartners/delhivery.js",
        },
        null,
        2,
      ),
    );

    if (response.data && response.data.packages && response.data.packages[0]) {
      if (response.data.packages[0].status !== "Fail") {
        const awbNumber = response.data.packages[0].waybill;

        const updatedOrder = await prisma.orders.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.READY_TO_SHIP,
            awbNumber: awbNumber,
          },
        });

        return { success: true, awbNumber };
      } else {
        if (response.data.packages[0].serviceable === false) {
          console.error("Pincode is not serviceable");
          return { success: false, message: "Pincode is not serviceable" };
        } else if (response.data.packages[0].sort_code === "BAN/EEN") {
          console.error(
            ":Warehouse is banned, choose a different warehouse to proceed",
          );
          return {
            success: false,
            error:
              ":Warehouse is banned, choose a different warehouse to proceed",
          };
        } else {
          console.error(
            JSON.stringify({
              message: `Failed to create Delhivery order: ${response.data.packages[0].status}`,
              path: "deliveryPartners/delhivery.js",
            }),
          );
          return {
            success: false,
            message: "Failed to create Delhivery order",
          };
        }
      }
    } else {
      console.error("Unexpected response format from Delhivery API");
      return {
        success: false,
        message: "Unexpected response format from Delhivery API",
      };
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Error creating Delhivery shipment:",
        errorDetails: error,
        path: "deliveryPartners/delhivery.js",
      }),
    );

    if (error instanceof Error) {
      return { success: false, error: error.message };
    } else {
      return { success: false, error: "An unknown error occurred" };
    }
  }
}

export async function createDelhiveryReverseOrder(orderId: number) {
  try {
    console.log("Starting createDelhiveryReverseOrder for orderId:", orderId);

    const token = await getDeliveryPartnerToken("Delhivery");

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        reverseCustomerAddress: true,
        ReversePickupAddress: true,
        Users: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: `Order not found for orderId: ${orderId}`,
      };
    }

    console.log("Order details:", JSON.stringify(order, null, 2));

    const reverseCustomerAddress = order.reverseCustomerAddress;
    const reversePickupAddress = order.ReversePickupAddress;

    if (!reversePickupAddress || !reverseCustomerAddress) {
      return {
        success: false,
        error: "ReversePickupAddress or reverseCustomerAddress not found",
      };
    }

    const warehouseDetails: WarehouseDetails = {
      name: reverseCustomerAddress.tag,
      email: reverseCustomerAddress.email || "default@example.com",
      phone: reverseCustomerAddress.contactNumber,
      address: reverseCustomerAddress.address,
      city: reverseCustomerAddress.city,
      country: "India",
      pin: reverseCustomerAddress.pincode.toString(),
      return_address: reversePickupAddress.address,
      return_pin: reversePickupAddress.pincode.toString(),
      return_city: reversePickupAddress.city,
      return_state: reversePickupAddress.state,
      return_country: "India",
    };

    // console.log("Warehouse creation started");
    // console.log("warehouseDetails : ", warehouseDetails);

    try {
      const warehouseResponse = await axios.post(
        "https://track.delhivery.com/api/backend/clientwarehouse/create/",
        warehouseDetails,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Token ${token}`,
          },
        },
      );

      if (warehouseResponse.data.success) {
        console.log("Warehouse creation successful");
      } else {
        if (
          warehouseResponse.data.error &&
          warehouseResponse.data.error[0]?.includes("already exists")
        ) {
          console.log("Warehouse already exists");
        } else {
          console.error(
            "Failed to create warehouse:",
            warehouseResponse.data.error,
          );
        }
      }
    } catch (warehouseError) {
      console.warn(
        "Warehouse creation failed, proceeding with existing warehouse:",
        warehouseError,
      );
    }

    const shipmentData = {
      shipments: [
        {
          name: reversePickupAddress.fullName,
          add: reversePickupAddress.address,
          pin: reversePickupAddress.pincode.toString(),
          city: reversePickupAddress.city,
          state: reversePickupAddress.state,
          country: "India",
          phone: reversePickupAddress.contactNumber,
          order: generateRandomOrderId(order.orderId),
          payment_mode: "Pickup",
          return_pin: reverseCustomerAddress.pincode.toString(),
          return_city: reverseCustomerAddress.city,
          return_phone: reverseCustomerAddress.contactNumber,
          return_add: reverseCustomerAddress.address,
          return_state: reverseCustomerAddress.state,
          return_country: "India",
          cod_amount:
            order.paymentMode?.toLowerCase() === "cod"
              ? order.totalOrderValue?.toString() ?? "0"
              : "0",
          total_amount: order.totalOrderValue?.toString() ?? "0",
          shipment_width: order.breadth?.toString() || "",
          shipment_height: order.height?.toString() || "",
          weight: order.applicableWeight?.toString() || "",
          shipping_mode: order.shippingMode || "Surface",
        },
      ],
      pickup_location: {
        name: reverseCustomerAddress.tag,
        add: reverseCustomerAddress.address,
        city: reverseCustomerAddress.city,
        pin_code: reverseCustomerAddress.pincode,
        country: "India",
        phone: reverseCustomerAddress.contactNumber,
      },
    };

    const jsonData = JSON.stringify(shipmentData);
    const requestBody = `format=json&data=${encodeURIComponent(jsonData)}`;

    //   console.log("Delhivery API request body:", requestBody);

    const response = await axios.post(
      "https://track.delhivery.com/api/cmu/create.json",
      requestBody,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Token ${token}`,
        },
      },
    );

    console.log(
      JSON.stringify({
        data: "Delhivery API response:",
        responseData: response.data,
        path: "deliveryPartner/delhivery",
      }),
    );

    if (
      response.data.success &&
      response.data.packages &&
      response.data.packages[0]?.status !== "Fail"
    ) {
      const awbNumber = response.data.packages[0].waybill;

      const updatedOrder = await prisma.$transaction(async (prisma) => {
        const updatedOrder = await prisma.orders.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.READY_TO_SHIP,
            awbNumber: awbNumber,
          },
        });

        return updatedOrder;
      });

      //   console.log("Reverse order updated with AWB number:", updatedOrder);
      // revalidatePath("/orders");

      const safeToNumber = (
        value: Prisma.Decimal | null | undefined,
      ): number | null => {
        return value ? value.toNumber() : null;
      };

      return {
        success: true,
        order: {
          ...updatedOrder,
          deadWeight: safeToNumber(updatedOrder.deadWeight),
          breadth: safeToNumber(updatedOrder.breadth),
          height: safeToNumber(updatedOrder.height),
          length: safeToNumber(updatedOrder.length),
          applicableWeight: safeToNumber(updatedOrder.applicableWeight),
          totalOrderValue: safeToNumber(updatedOrder.totalOrderValue),
        },
        awbNumber: awbNumber,
      };
    } else {
      const remarks =
        response.data.packages?.[0]?.remarks || JSON.stringify(response.data);
      return {
        success: false,
        error: remarks,
        details: response.data,
      };
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        data: "Error in createDelhiveryReverseOrder:",
        error,
        path: "deliveryPartner/delhivery",
      }),
    );

    // If it's an API error response containing the remarks
    if (
      axios.isAxiosError(error) &&
      error.response?.data?.packages?.[0]?.remarks
    ) {
      const remarks = error.response.data.packages[0].remarks;
      return { success: false, error: remarks };
    }

    // Default error handling
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error:
        "An unexpected error occurred while creating Delhivery reverse order",
    };
  }
}

export async function createDelhiveryNdr(order: any, data: any, type: string) {
  console.log("Starting createDelhiveryNdr for order:", order);
  console.log("Data:", data);

  try {
    const token = await getToken(order.DeliveryPartner.partnerName);
    console.log("Token:", token);
    
    const orders = await prisma.orders.findUnique({
      where: { orderId: Number(order.orderId) },
      include: {
        customerAddress: true,
      },
    });;
    
    if (!orders) {
      return { success: false, error: "Order not found" };
    }

    // Check if we're doing a re-attempt only or editing + re-attempt
    const isReAttemptOnly = JSON.stringify(data) === "{}";
    
    // If data contains updates, edit the shipment first
    if (!isReAttemptOnly) {
      const editResult = await editShipmentDetails(orders, data, token);

      if (!editResult.success) {
        return editResult;
      }
    }
    
    // Perform re-attempt request
    const reattemptResult = await requestReAttempt(order.awbNumber, token);
    if (!reattemptResult.success) {
      return reattemptResult;
    }
    
    // Update customer address in database if needed
    if (data.address || data.phone) {
      await updateCustomerAddressInDb(orders, data);
    }
    
    return { success: true, message: "NDR created successfully" };
  } catch (error) {
    return handleApiError(error, "createDelhiveryNdr");
  }
}



async function editShipmentDetails(orders: any, data: any, token: string) {

  console.log("Starting editShipmentDetails for order:", orders);
  
  const requestBody = {
    waybill: orders.awbNumber,
    phone: data?.phone || "",
    name: "",
    add: data?.address || "",
    product_details: "",
    shipment_length: parseFloat((orders?.length || 0).toFixed(1)) + 0.1,
    shipment_width: parseFloat((orders?.breadth || 0).toFixed(1)) + 0.1,
    shipment_height: parseFloat((orders?.height || 0).toFixed(1)) + 0.1,
    weight: parseFloat((orders?.applicableWeight || 0).toFixed(1)) + 0.0,
  };

  console.log("Request body for NDR edit:", requestBody);

  try {
    const editResponse = await axios.post(
      "https://track.delhivery.com/api/p/edit",
      requestBody,
      {
        headers: getRequestHeaders(token),
      }
    );

    console.log("NDR Edit Response from Delhivery:", editResponse.data);
    console.log("NDR Response from Delhivery:", editResponse.data.status);

    if (editResponse.data?.status == "Failure") {
      return {
        success: false,
        error:
          editResponse.data?.message ||
          editResponse.data?.error ||
          "Failed to edit shipment details",
      };
      
    }

    return { success: true };
  } catch (error) {
    return handleApiError(error, "editShipmentDetails");
  }
}

async function requestReAttempt(awbNumber: string, token: string) {
  const updateRequestBody = {
    data: [
      {
        waybill: awbNumber,
        act: "RE-ATTEMPT",
      },
    ],
  };
  
  console.log("Request body for NDR re-attempt:", updateRequestBody);

  try {
    const updateResponse = await axios.post(
      "https://track.delhivery.com/api/p/update",
      updateRequestBody,
      {
        headers: getRequestHeaders(token),
      }
    );

    console.log("Update response:", updateResponse.data);

    if (updateResponse.data?.request_id && !updateResponse.data.error) {
      return { success: true };
    }

    return {
      success: false,
      error:
        updateResponse.data?.message ||
        updateResponse.data?.error ||
        "Failed to create NDR",
    };
  } catch (error) {
    return handleApiError(error, "requestReAttempt");
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

function getRequestHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Token ${token}`,
  };
}

function handleApiError(error: any, source: string) {
  if (axios.isAxiosError(error) && error.response) {
    console.error(`Error in ${source}:`, {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
    });

    const errorMessage =
      error.response.data?.message ||
      error.response.data?.error ||
      error.response.data?.detail ||
      "Error from Delhivery API";

    return {
      success: false,
      error: `Delhivery API error: ${errorMessage} (${error.response.status})`,
    };
  }

  if (error instanceof Error) {
    console.error(`Error in ${source}:`, error);
    return { success: false, error: error.message };
  }

  console.error(`Unexpected error in ${source}:`, error);
  return {
    success: false,
    error: `An unexpected error occurred in ${source}`,
  };
}
