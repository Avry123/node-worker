"use server";

import axios from "axios";

import {

  Orders,
  OrderStatus,
  Prisma,

} from "@prisma/client";
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

type CreateOnlineXpressReverseOrderResult = {
  success: boolean;
  order?: Orders;
  awbNumber?: string;
  error?: string;
};

const safeToNumber = (
  value: Prisma.Decimal | null | undefined,
): number | null => {
  return value ? value.toNumber() : null;
};

function generateRandomOrderId(orderId: any) {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${orderId}-${randomNum}`;
}

export async function createOnlineXpressOrder(orderId: number) {
  try {
    console.log("Starting createOnlineXpressOrder for orderId:", orderId);
    const token = await getDeliveryPartnerToken("onlinexpress");

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
      return { success: false, error: "Order not found" };
    }

    // if (order.awbNumber) {
    //   console.log("Order already has an AWB number:", order.awbNumber);
    //   return { success: true, awbNumber: order.awbNumber };
    // }

    const warehouseAddress = await prisma.address.findUnique({
      where: { id: order.agentAddressId ?? undefined },
    });

    if (!warehouseAddress) {
      console.error("Warehouse address not found");
      return { success: false, error: "Warehouse address is required" };
    }

    // Warehouse creation logic
    const warehouseDetails = {
      shortcode: order?.Users?.StoreName,
      customer_id: "8517",
      address: warehouseAddress.address,
      type: "pickup",
      city: warehouseAddress.city,
      pincode: warehouseAddress.pincode,
      phone: warehouseAddress.contactNumber,
    };

    console.log("Warehouse creation started");
    console.log("warehouseDetails : ", warehouseDetails);

    try {
      const warehouseResponse = await axios.post(
        "https://onlinexpress.co.in/admin/services/addData/pickup",
        warehouseDetails,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            AUTH_USER: "SHYPBUDDY INDIA PRIVATE LIMITED",
            AUTH_PW: `${token}`,
          },
        },
      );

      if (warehouseResponse.data.failedDetails == "SUCCESS") {
        console.log("Warehouse creation successful");
      } else {
        if (warehouseResponse.data.failedDetails?.includes("Duplicate entry")) {
          console.log("Warehouse already exists");
        } else {
          console.error(
            JSON.stringify({
              data: "Failed to create warehouse:",
              messgae: warehouseResponse.data.failedDetails,
              path: "deliverypartner/onlinexpress",
            }),
          );
        }
      }
    } catch (warehouseError) {
      console.warn(
        "Warehouse creation failed, proceeding with existing warehouse:",
        warehouseError,
      );
    }

    // Order creation logic
    const customerAddress = order.customerAddress;
    const collectableAmount =
      order.paymentMode?.toLowerCase() === "cod" ? order.totalOrderValue : 0;

    const requestBody = {
      type: "regular",
      result: [
        {
          "AWB NO": "",
          "REFRENCE NO": generateRandomOrderId(order.orderId),
          "SKU CODE": "Product Details",
          "CLIENT NAME": "SHYPBUDDY INDIA PRIVATE LIMITED",
          "CONSIGNEE NAME": customerAddress?.fullName,
          ADDRESS: customerAddress?.address,
          ORIGIN: "Delhi",
          // "DESTINATION": customerAddress?.city,
          DESTINATION: "Delhi",
          // "PINCODE": customerAddress?.pincode,
          PINCODE: customerAddress?.pincode,
          "MOBILE NO": customerAddress?.contactNumber,
          "ALT MOBILE NO": customerAddress?.alternateNumber || "",
          MODE: order.paymentMode,
          WEIGHT: order.applicableWeight,
          "DECLARE VALUE": order.totalOrderValue,
          "CALLECTABLE AMOUNT": collectableAmount,
          "BOOKING DATE": new Date(),
          QUANTITY: "1",
          "DELIVERY DATE": "",
          "HUB ADDRESS": order?.Users?.StoreName,
          ESSENTIAL: "",
          DADDRESS: warehouseAddress.address,
          DCITY: warehouseAddress.city,
          DPINCODE: warehouseAddress.pincode,
          DPHONE: warehouseAddress.contactNumber,
          PRODUCTS: order.Packages.map((item) => ({
            "SKU CODE": item.sku || "dummy SKU",
            QUANTITY: item.quantity,
            BRAND: "",
            COLOR: "",
            REASON: "",
            IMAGES: "",
          })),
        },
      ],
      branch_id: "1",
      user: "SHYPBUDDY INDIA PRIVATE LIMITED",
      from_api: "y",
    };

    console.log(
      "Online Xpress API request body:",
      JSON.stringify(requestBody, null, 2),
    );
    console.log("About to make Online Xpress API call for shipping");

    const response = await axios.post(
      "https://onlinexpress.co.in/admin/services/booking",
      requestBody,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          AUTH_USER: "SHYPBUDDY INDIA PRIVATE LIMITED",
          AUTH_PW: `${token}`,
        },
      },
    );

    //   console.log("Online Xpress API call completed");
    console.log(
      "Online Xpress API response:",
      JSON.stringify({
        data: response.data,
        path: "deliveryPartner/onlinexpress",
      }),
    );

    if (response.data && response.data.success) {
      const awbNumber = response.data.successfulAWBS[0];

      // Update the order status and AWB number
      const updatedOrder = await prisma.orders.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.READY_TO_SHIP,
          awbNumber: awbNumber,
          shippingDate: new Date(),
        },
      });

      // console.log("Updated order with shipment details:", updatedOrder);
      // revalidatePath("/orders");

      return { success: true, awbNumber };
    } else {
      console.error(
        JSON.stringify({
          message: `Failed to create Online Xpress order: ${
            response.data.message || "Unknown error"
          }`,
          path: "deliverypartner/onlinexpress",
        }),
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Error creating Online Xpress shipment:",
        errorDetails: error,
        path: "deliverypartner/onlinexpress",
      }),
    );

    // Update order status to CANCELLED if shipment creation fails
    await prisma.orders.update({
      where: { id: orderId },
      data: { status: "NEW" },
    });
    if (error instanceof Error) {
      return { success: false, error: error.message };
    } else {
      return { success: false, error: "An unknown error occurred" };
    }
  }
}

export async function cancelOnlineXpressOrder(awbNumber: string) {
  try {
    //   console.log("awbNumber line no. 232:", awbNumber);
    const token = await getDeliveryPartnerToken("onlinexpress");
    const response = await axios.get(
      `https://onlinexpress.co.in/admin/services/cancelRequest?awbs=${awbNumber}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          AUTH_USER: "SHYPBUDDY INDIA PRIVATE LIMITED",
          AUTH_PW: `${token}`,
        },
      },
    );

    // console.log(
    //   "Cancellation Response from OnlineXpress line 254:",
    //   response.data,
    // );

    if (response.data.failure.length == 0) {
      // Fetch the order first to ensure it exists
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
      
      // revalidatePath(`/orders`);
      return { success: true, message: "Order cancelled successfully" };
      // return(r)
    } else {
      JSON.stringify({
        message: "Error cancelling  order:",
        errorDetails: response.status,
        path: "deliverypartner/onlineexpress",
      });
      return { success: false, message: "Order cancellation unsuccessfully" };
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Error cancelling order:",
        errorDetails: error,
        path: "deliverypartner/onlineexpress",
      }),
    );

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
