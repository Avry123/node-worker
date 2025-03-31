"use server";

import axios from "axios";
import { getDeliveryPartnerToken } from "./tokenManager";
import prisma from "../../lib/prisma";
import { OrderStatus } from "@prisma/client";
import { serializeDecimal } from "../user";



export async function createDtdcOrder(orderId: number, mode: string) {
  try {
    const token = await getDeliveryPartnerToken("dtdc");

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

    const weight = parseFloat(order.applicableWeight?.toString() || "0");
    if (weight > 100) {
      console.error(
        "Package weight exceeds DTDC's limit of 100 kg. Please split the shipment or choose a different courier.",
      );
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
    const requestBody = {
      consignments: [
        {
          customer_code: "GL4949",
          reference_number: "",
          service_type_id:
            mode === "surface" ? "B2C SMART EXPRESS" : "B2C PRIORITY",
          load_type: "NON-DOCUMENT",
          consignment_type: "Forward",
          dimension_unit: "cm",
          length: order.length?.toString() || "0",
          width: order.breadth?.toString() || "0",
          height: order.height?.toString() || "0",
          weight_unit: "kg",
          weight: order.applicableWeight?.toString() || "0",
          cod_amount:
            order.paymentMode?.toLowerCase() === "prepaid"
              ? 0
              : order.totalOrderValue,
          cod_collection_mode:
            order.paymentMode?.toLowerCase() === "prepaid" ? "" : "cash",
          declared_value: order.totalOrderValue?.toString(),
          num_pieces: order.Packages.length.toString(),
          origin_details: {
            name: warehouseAddress.tag,
            phone: warehouseAddress.contactNumber,
            alternate_phone: warehouseAddress.alternateNumber || "",
            address_line_1: warehouseAddress.address,
            address_line_2:
              warehouseAddress?.landmark == " "
                ? "null"
                : warehouseAddress?.landmark,
            pincode: warehouseAddress.pincode.toString(),
            city: warehouseAddress.city,
            state: warehouseAddress.state,
          },
          destination_details: {
            name: customerAddress.fullName,
            phone: customerAddress.contactNumber,
            alternate_phone: customerAddress.alternateNumber || "",
            address_line_1: customerAddress.address,
            address_line_2: customerAddress.landmark || "null",
            pincode: customerAddress.pincode.toString(),
            city: customerAddress.city,
            state: customerAddress.state,
          },
          pieces_detail: order.Packages.map((item) => ({
            description: item.productName,
            declared_value: item.price,
            weight: "0",
            height: "0",
            length: "0",
            width: "0",
          })),
        },
      ],
    };

    const response = await axios.post(
      "https://dtdcapi.shipsy.io/api/customer/integration/consignment/softdata",
      requestBody,
      {
        headers: {
          "api-key": `${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("request body for dtdc", JSON.stringify(requestBody));
    if (response.data?.data?.[0]?.success === true) {
      const awbNumber = response.data?.data[0].reference_number;

      const updatedOrder = await prisma.orders.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.READY_TO_SHIP,
          awbNumber: awbNumber,
          shippingDate: new Date(),
        },
      });

      // Download the label

// revalidatePath("/orders");

return {
        success: true,
        order: serializeDecimal(updatedOrder),
        awbNumber: awbNumber,
      };

     
    } else {

      const errorMessage = response.data?.data?.[0]?.message;
      if (errorMessage?.toLowerCase() === "auto allocated hub not found") {
        return {
          success: false,
          error: "Pincode not serviceable"
        };
      }
      console.error(
        JSON.stringify({
          message: `Failed to create DTDC order: ${errorMessage}`,
          path: "deliverypartner/dtdc",
        }),
      );
      return {
        success: false,
        error: `Failed to create DTDC order: ${errorMessage || "Unknown error"}`,
      };
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Error in createDtdcOrder:",
        errorDetails: error,
        path: "deliverypartner/dtdc",
      }),
    );

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function cancelDtdcOrder(awbNumber: string) {
  try {
    console.log("awbNumber:", awbNumber);
    const token = await getDeliveryPartnerToken("dtdc");
    console.log("The cancel Dtdc is triggered, the token ", token);

    const requestBody = {
      AWBNo: [awbNumber],
      customerCode: "GL4949",
    };

    const response = await axios.post(
      "http://dtdcapi.shipsy.io/api/customer/integration/consignment/cancel",
      requestBody,
      {
        headers: {
          "api-key": `${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(
      JSON.stringify({
        message: "Cancellation Response:",
        error: response.data?.data?.error[0],
        path: "deliverypartner/dtdc",
      }),
    );

    if (
      response.data.success === true ||
      response.data.failures[0].current_status == "cancelled"
    ) {
      // Update the ShipmentDetails table

      console.log(
        `Order with AWB number ${awbNumber} has been successfully cancelled.`,
      );
      return { success: true, message: "Order cancelled successfully" };
    } else {
      // console.error("Failed to cancel order:", response.data.status);
      return { success: false, message: "Order cancellation unsuccessful" };
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Error cancelling order:",
        errorDetails: error,
        path: "deliverypartner/dtdc",
      }),
    );

    return error;
  }
}

export async function dtdcServiceable(
  originpin: number,
  destinationpin: number,
) {}
