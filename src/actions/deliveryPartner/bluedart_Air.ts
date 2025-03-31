"use server";
import prisma from "../../lib/prisma";
import { serializeDecimal } from "../user";
import { getDeliveryPartnerToken } from "./tokenManager";
// import { revalidatePath } from "next/cache";



export async function createBluedart_Air(orderId: number) {
  try {
    const token = await getDeliveryPartnerToken("BlueDart_Air");
    const reference_id = orderId + Math.floor(Math.random() * 1000).toString();
    //  console.log('Line 16 ', reference_id);
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

    if (!order?.agentAddressId) {
      return { success: false, error: "Customer Details missing" };
    }

    const warehouse = await prisma.address.findUnique({
      where: { id: order.agentAddressId },
    });

    const returnAddress = order.rtoAgentAddressId
      ? await prisma.address.findUnique({
          where: { id: order.rtoAgentAddressId },
        })
      : null;

    // First check if COD is available for the pincode
    const areacheck = await fetch(
      "https://apigateway.bluedart.com/in/transportation/finder/v1/GetServicesforPincode",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          JWTToken: token,
        },
        body: JSON.stringify({
          pinCode: warehouse?.pincode,
          profile: {
            Api_type: "S",
            LicenceKey: process.env.BLUEDART_AIR_LICENSE_KEY,
            LoginID: process.env.BLUEDART_AIR_LOGIN_ID,
          },
        }),
      },
    );

    const areacode = await areacheck.json();

    // Check if COD is allowed for this pincode
    const isCODOrder = order.paymentMode?.toLowerCase() === "cod";
    const collectableAmount = isCODOrder ? order.totalOrderValue || 0 : 0;

    // If COD is not available for this pincode and it's a COD order, return early
    if (isCODOrder && !areacode.GetServicesforPincodeResult?.CODAvailable) {
      return {
        success: false,
        error:
          "Cash on Delivery (COD) is not available for the given pincode. Please choose prepaid payment mode.",
      };
    }

    const requestBody = {
      Request: {
        Consignee: {
          ConsigneeAddress1: order.customerAddress?.address || "",
          ConsigneeEmailID: order.customerAddress?.email || "",
          ConsigneeMobile: order.customerAddress?.contactNumber || "",
          ConsigneeName: order.customerAddress?.fullName || "",
          ConsigneePincode: order.customerAddress?.pincode || "",
        },
        Services: {
          AWBNo: "",
          ActualWeight: order.applicableWeight || 0,
          CollectableAmount: collectableAmount,
          CreditReferenceNo: reference_id,
          DeclaredValue: order.totalOrderValue || 0,
          Dimensions: [
            {
              Breadth: order.breadth || 0,
              Height: order.height || 0,
              Length: order.length || 0,
            },
          ],
          IsDedicatedDeliveryNetwork: false,
          IsDutyTaxPaidByShipper: false,
          IsForcePickup: false,
          IsPartialPickup: false,
          IsReversePickup: false, // Changed to false as true might be causing issues
          Officecutofftime: "",
          PDFOutputNotRequired: true,
          PickupTime: "1600",
          PieceCount: "1",
          ProductCode: "A",
          ProductType: 1,
          RegisterPickup: true,
          SubProductCode: isCODOrder ? "C" : "P",
          itemdtl: order.Packages.map((item) => ({
            ItemID: item.PackageId.toString(),
            ItemName: item.productName || "",
            ItemValue: item.price || 0,
            Itemquantity: item.quantity || 0,
          })),
          noOfDCGiven: 0,
        },
        Shipper: {
          CustomerAddress1: warehouse?.address || "",
          CustomerCode: process.env.BLUEDART_AIR_CUSTOMER_CODE || 701245,
          CustomerEmailID: warehouse?.email || "",
          CustomerMobile: warehouse?.contactNumber || "",
          CustomerName: order?.Users?.StoreName || warehouse?.tag || "",
          CustomerPincode: warehouse?.pincode || "",
          IsToPayCustomer: isCODOrder,
          OriginArea: areacode.GetServicesforPincodeResult?.AreaCode || "",
        },
        Returnadds: {
          ReturnAddress1: returnAddress?.address || "",
          ReturnEmailID: returnAddress?.email || "",
          ReturnMobile: returnAddress?.contactNumber || "",
          ReturnPincode: returnAddress?.pincode || "",
        },
      },
      Profile: {
        LoginID: process.env.BLUEDART_AIR_LOGIN_ID || "",
        LicenceKey: process.env.BLUEDART_AIR_LICENSE_KEY || "",
        Api_type: "S",
      },
    };

    console.log("BlueDart Request Body:", JSON.stringify(requestBody));

    const response = await fetch(
      "https://apigateway.bluedart.com/in/transportation/waybill/v1/GenerateWayBill",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          JWTToken: token,
        },
        body: JSON.stringify(requestBody),
      },
    );

    const responseData = await response.json();
    console.log(
      JSON.stringify({
        data: responseData,
        path: "deliveryPartner/bluedart_air",
      }),
    );
    // Handle BlueDart specific errors
    if (!response.ok || responseData["error-response"]) {
      const errorResponse = responseData["error-response"]?.[0];
      if (errorResponse?.Status?.length > 0) {
        const errorMessages = errorResponse.Status.map(
          (status: any) => `${status.StatusInformation}`,
        ).join(", ");
        return {
          success: false,
          error: `BlueDart Error: ${errorMessages}`,
        };
      }
      return {
        success: false,
        error: `BlueDart API Error: ${JSON.stringify(responseData)}`,
      };
    }

    const regex = /\/Date\((\d+)([+-]\d{4})\)\//;
    const [, timestamp] =
      responseData.GenerateWayBillResult.ShipmentPickupDate.match(regex);
    const date = new Date(parseInt(timestamp));

    const TokenNumber = responseData.GenerateWayBillResult.TokenNumber.replace(
      "DEMO",
      "",
    );
    //    console.log('Line 177 ', TokenNumber);

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        pickupTime: date,
      },
    });

    // revalidatePath("/orders");

    return {
      success: true,
      order: serializeDecimal(updatedOrder),
      awbNumber: responseData.GenerateWayBillResult.AWBNo,
      label: "",
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        data: "Error in createBluedart_Air:",
        error,
        path: "deliveryPartner/bluedart_air",
      }),
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function cancel_bluedartAir(awbNumber: string) {
  try {
    const token = await getDeliveryPartnerToken("BlueDart_Air");

    // Construct the request body in the desired format
    const requestBody = {
      Request: {
        AWBNo: awbNumber, // Pass the AWB number dynamically
      },
      Profile: {
        LoginID: process.env.BLUEDART_AIR_LOGIN_ID, // Use environment variables for dynamic values
        Api_type: "S",
        LicenceKey: process.env.BLUEDART_AIR_LICENSE_KEY, // Use environment variables for dynamic values
      },
    };

    // Log the request body in a readable format before making the API call
    //   console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      "https://apigateway.bluedart.com/in/transportation/waybill/v1/CancelWaybill",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          JWTToken: token,
        },
        body: JSON.stringify(requestBody),
      },
    );

    const responseData = await response.json();
    console.log(
      JSON.stringify({
        data: responseData,
        path: "deliveryPartner/bluedart_air",
      }),
    );

    // Get error message from any of the possible error formats
    const errorMsg =
      responseData["error-response"]?.[0]?.Status?.[0]?.StatusInformation ||
      responseData["error-response"]?.[0] ||
      responseData.CancelWayBillResult?.Status?.[0]?.StatusInformation;

    // If error message includes 'already cancelled', treat as success
    if (
      errorMsg?.toLowerCase().includes("already cancelled") ||
      responseData.status == 415
    ) {
      return {
        success: true,
        message: "Order already cancelled",
      };
    }

    // If there's an error message and it's not about already being cancelled, return it
    if (errorMsg) {
      return {
        success: false,
        error: errorMsg,
      };
    }

    // If no error was found, assume success
    return {
      success: true,
      message: "Order cancelled successfully",
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        data: "Error in cancel_bluedartAir:",
        error,
        path: "deliveryPartner/bluedart_air",
      }),
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
