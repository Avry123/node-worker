// "use server";

import axios from "axios";
import {  OrderStatus, Prisma } from "@prisma/client";
import { getDeliveryPartnerToken } from "./tokenManager";
import prisma from "../../lib/prisma";



function generateRandomOrderId(orderId: any) {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${orderId}-${randomNum}`;
}

export async function createShadowfaxOrder(orderId: number,type:string) {
  try {
let token
    if(type == "surface"){
      token = await getDeliveryPartnerToken("shadowfax");
    }else if(type == "sdd/ndd"){
      console.log("Shadowfax SDD/NDD token")
      token = await getDeliveryPartnerToken("shadowfaxsdd")
    }
    
    const clientOrderId =
      orderId + Math.floor(100 + Math.random() * 900).toString();

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
      return { success: false, error: "Warehouse not found" };
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
      order_type: "marketplace",
      order_details: {
        client_order_id: generateRandomOrderId(order.orderId),
        actual_weight: order.applicableWeight,
        product_value:  order.totalOrderValue,
        payment_mode: order.paymentMode,
        total_amount: order.totalOrderValue,
        cod_amount: collectableAmount,
      },
      customer_details: {
        name: customerAddress.fullName,
        contact: String(customerAddress.contactNumber),
        address_line_1: customerAddress.address,
        address_line_2: customerAddress.landmark,
        city: customerAddress.city,
        state: customerAddress.state,
        pincode: customerAddress.pincode,
        alternate_contact: String(customerAddress.alternateNumber),
      },
      pickup_details: {
        name: order?.Users?.StoreName || warehouseAddress.tag,
        contact: String(warehouseAddress.contactNumber),
        address_line_1: warehouseAddress.address,
        address_line_2: warehouseAddress.landmark,
        city: warehouseAddress.city,
        state: warehouseAddress.state,
        pincode: warehouseAddress.pincode,
      },
      rto_details: {
        name: order?.Users?.StoreName || rtoWarehouseAddress.tag,
        contact: String(rtoWarehouseAddress.contactNumber),
        address_line_1: rtoWarehouseAddress.address,
        address_line_2: rtoWarehouseAddress.landmark,
        city: rtoWarehouseAddress.city,
        state: rtoWarehouseAddress.state,
        pincode: rtoWarehouseAddress.pincode,
        unique_code: order?.Users?.StoreName || rtoWarehouseAddress.tag,
      },
      product_details: order.Packages.map((item) => ({
        hsn_code: item.hsn || "N/A",
        sku_name: item.productName,
        sku_id: item.sku || "N/A",
        category: item.category || "N/A",
        price: Number(item.price),
      })),
    };

    const response = await axios.post(
      "https://dale.shadowfax.in/api/v3/clients/orders/",
      requestBody,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log(JSON.stringify(requestBody), "requestBody for shadowfax");
    //console.log('hi',response.data)
    if (response.data.message !== "Success") {
      console.error(
        JSON.stringify({
          errorDetails: response.data.errors,
          path: "deliveryPartner/shadowfax",
        }),
      );

      return { success: false, error: response.data.errors };
    }

    const awbNumber = response.data.data.awb_number;

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.READY_TO_SHIP,
        awbNumber: awbNumber,
        shippingDate: new Date(),
      },
    });

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
      clientOrderId: clientOrderId, // Include it in the return value if needed for reference
    };
  } catch (error: any) {
    //console.error("Error in createShadowfaxOrder:", error);

    let errorMessage = "An unknown error occurred";

    if (error.response && error.response.data && error.response.data.errors) {
      errorMessage = error.response.data.errors;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

// export async function downloadShadowfaxLabel(
//   awbNumber: string,
// ): Promise<string> {
//   // Implement label download logic here
//   console.error("Not implemented");
// }


export async function createReverseShadowfaxOrder(orderId: number) {
  try {
    const token = await getDeliveryPartnerToken("shadowfax");

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

    const pickupAddress = await prisma.customerAddress.findFirst({
      where: {
        customerId: order.reverseAgentAddressId || undefined,
      },
    });

    if (!pickupAddress) {
      console.error("Warehouse address not found");
      return { success: false, error: "Warehouse address not found" };
    }

    const customerAddress = await prisma.address.findFirst({
      where: {
        id: order.reverseCustomerId || undefined,
      },
    });

    const requestBody = {
      // Required string fields
      client_order_number: generateRandomOrderId(order.orderId),
      warehouse_name: order?.Users?.StoreName || customerAddress?.tag,
      warehouse_address: customerAddress?.address || "Client Warehouse Address",
      destination_pincode: customerAddress?.pincode,
      unique_code: `warehouse${orderId}`,
      pickup_type: "regular",

      // Required number fields
      total_amount: order.totalOrderValue,
      price:
        order.paymentMode?.toLowerCase() === "prepaid"
          ? 0
          : order.totalOrderValue,

      // Required if total_amount > 50000
      eway_bill: "",

      // Required address_attributes
      address_attributes: {
        address_line: pickupAddress?.address,
        city: pickupAddress?.city,
        country: "India", // Added from first example
        pincode: pickupAddress?.pincode,
        name: pickupAddress?.fullName,
        phone_number: pickupAddress?.contactNumber,
        // Optional address fields
        alternate_contact: pickupAddress?.alternateNumber,
        sms_contact: pickupAddress?.contactNumber,
        latitude: "0.00000",
        longitude: "0.00000",
        location_accuracy: "L",
        location_type: "residential",
      },

      // Required skus_attributes array
      skus_attributes: order.Packages.map((item) => ({
        // Required SKU fields
        name: item.productName || "N/A",
        price: parseFloat(item.price) || 0,
        client_sku_id: item.sku || "N/A",
        hsn_code: item.hsn || "",
        invoice_id: " ",
        return_reason: "",
        // Required seller_details
        seller_details: {
          regd_name: customerAddress?.tag || "N/A",
          regd_address: customerAddress?.address || "N/A",
          state: customerAddress?.state || "N/A",
          gstin: " ",
        },

        // Required taxes object - keeping your zero defaults
        taxes: {
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          total_tax_amount: 0,
        },

        // Optional but recommended fields
        category: item.category || "N/A",
        brand: item.brand || "N/A",
        qc_required: true,
        qc_rules: [
          {
            question: "Is product as per description?",
            is_mandatory: 1,
            value: "Yes",
          },
        ],
        additional_details: {
          color: item.color || "N/A",
          size: item.size || "N/A",
          sku_images: [item.image],
          quantity_value: item.quantity || 1,
          quantity_unit: "EA",
        },
      })),
    };

    const response = await axios.post(
      "https://dale.shadowfax.in/api/v3/clients/requests",
      requestBody,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log(requestBody, "requestBody for shadowfax");
    console.log("dataaa", response, "response for shadowfax");

    if (response.data.message === "Success") {
      const result = await prisma.$transaction(async (prismaTransaction) => {
        return await prismaTransaction.orders.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.READY_TO_SHIP,
            awbNumber: response.data.awb_number,
            shippingDate: new Date(),
          },
        });
      });

      return {
        success: true,
        awbNumber: response.data.awb_number,
      };
    } else {
      return {
        success: false,
        error:
          response.data.errors ||
          response.data.message ||
          "Failed to create Shadowfax order",
      };
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      // Detailed Axios error handling
      console.error("Axios Error Response:", error.response?.data);
      console.error("Axios Error Status:", error.response?.status);
      console.error("Axios Error Headers:", error.response?.headers);
      console.error("Axios Error Message:", error.message);
      return {
        success: false,
        error: `Failed to create Shadowfax order: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`,
      };
    } else {
      // General error handling
      console.error("Error in createReverseShadowfaxOrder:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Shadowfax order",
      };
    }
  }
}
export async function cancelShadowfaxOrder(
  awbNumber: string,type:string
): Promise<{ success: boolean; message: string }> {
  try {
    let token
    if(type == "surface"){
      token = await getDeliveryPartnerToken("shadowfax");
    }else if(type == "sdd/ndd"){
      console.log("Shadowfax SDD/NDD token")
      token = await getDeliveryPartnerToken("shadowfaxsdd")
    }

    const requestBody = {
      request_id: awbNumber,
    };
    // console.log("Shadowfax Cancel API requestBody:", requestBody);

    //    console.log("token:",token);

    const response = await axios.post(
      "https://dale.shadowfax.in/api/v3/clients/orders/cancel/",
      requestBody,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    //   console.log("Shadowfax Cancel API Response:", response.data);

    if (
      response.data.responseMsg === "Request has been marked as cancelled" ||
      response.data.responseMsg ===
        "The request is already in its cancellation phase" ||
      response.data.responseMsg ===
        "Cannot cancel order from Cancelled By Customer" ||
      response.data.responseCode === 200
    ) {
      return {
        success: true,
        message: response.data.responseMsg || "Order cancelled successfully",
      };
    } else {
      const errorMessage =
        response.data.responseMsg || "Failed to cancel order with Shadowfax";
      console.error(
        JSON.stringify({
          message: "Failed cancelling Shadowfax order:",
          errorDetails: errorMessage,
          path: "deliveryPartner/shadowfax",
        }),
      );

      return {
        success: false,
        message: errorMessage,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to cancel Shadowfax order";
    console.error(
      JSON.stringify({
        message: "Error cancelling Shadowfax order:",
        errorDetails: error,
        path: "deliveryPartner/shadowfax",
      }),
    );

    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function cancelReverseShadowfaxOrder(awbNumber: string) {
  try {
    const token = await getDeliveryPartnerToken("Shadowfax");
    //console.log("Cancelling Shadowfax order reverse");

    const requestBody = {
      request_id: awbNumber,
      cancel_remarks: "cancelled by customer",
    };

    //console.log('Request body:', requestBody);

    const response = await axios.post(
      "https://dale.shadowfax.in/api/v2/clients/requests/mark_cancel",
      requestBody,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    //console.log("Shadowfax Cancel API Response:", response.data);

    if (response.data.responseCode === 200) {
      //console.log("Order cancellation successful");
      return {
        success: true,
        message: "Order cancelled successfully",
        data: response.data,
      };
    } else {
      console.error(
        JSON.stringify({
          data: "Failed to cancel order:",
          meesage: response.data.message || response.statusText,
          path: "deliveryPartner/shadowfax",
        }),
      );
      return {
        success: false,
        message:
          response.data.message || "Failed to cancel order with Shadowfax",
        data: response.data,
      };
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        data: "Error cancelling Shadowfax order:",
        message: error,
      }),
    );
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to cancel Shadowfax order",
      error: error,
    };
  }
}
