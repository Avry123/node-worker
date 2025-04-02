"use strict";
// "use server";
// import axios from "axios";
// import { OrderStatus, Prisma } from "@prisma/client";
// // import { revalidatePath } from "next/cache";
// import { getDeliveryPartnerToken } from "./tokenManager";
// import prisma from "../../lib/prisma";
// function generateRandomOrderId(orderId: any) {
//   const randomNum = Math.floor(Math.random() * 10000)
//     .toString()
//     .padStart(4, "0");
//   return `${orderId}-${randomNum}`;
// }
// export async function createAbhilayaOrder(
//   orderData: any,
//   mode: string,
//   dbOrder: any,
// ) {
//   console.log("line 16 from abhilaya", orderData);
//   try {
//     const order = orderData.orderData;
//     if (!order) {
//       console.error("Order not found");
//       return { success: false, error: "Order not found" };
//     }
//     const warehouseAddress = orderData.pickupAddress;
//     const rtoWarehouseAddress = orderData.rtoAddress;
//     if (!warehouseAddress) {
//       console.log("Warehouse address not found");
//       return { success: false, error: "Warehouse address not found" };
//     }
//     const userid = orderData.pickupAddress.userid;
//     const user = await getCurrentUser();
//     // Get the Abhilaya token
//     const token = await getDeliveryPartnerToken("abhilaya");
//     const requestBody = {
//       P1LogisticsID: mode,
//       ClientOrderNumber: generateRandomOrderId(orderData.orderId),
//       TransportMode: "Road",
//       SellerCode: "V0037",
//       PickupLocationName: user?.StoreName || warehouseAddress.tag,
//       PickupLocationAddress: `${warehouseAddress.address}, ${warehouseAddress.landmark}`,
//       PickupLocationPincode: warehouseAddress.pincode,
//       PickupLocationContactNumber: warehouseAddress.contactNumber,
//       DropLocationName: order.customerName,
//       DropLocationAddress: order.DeliveryAddressLine1,
//       DropLocationPincode: order.DeliveryAddressPostcode,
//       DropLocationContactNumber: order.customerNumber,
//       State: order.DeliveryAddressState,
//       City: order.DeliveryAddressCity,
//       OrderType: order.paymentMode?.toUpperCase() === "PREPAID" ? "PPD" : "COD",
//       CodValue:
//         order.paymentMode?.toLowerCase() === "prepaid"
//           ? "0"
//           : order.TotalOrderValue?.toString(),
//       ActualWeight: dbOrder.applicableWeight,
//       OrderValue: order.TotalOrderValue,
//       UserId: "1",
//       CompanyId: "2",
//       WarehouseId: "1",
//     };
//     const response = await axios.post(
//       "http://oneworld.isopronto.com/api/Odn/OdnInsert",
//       requestBody,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       },
//     );
//     console.log(response.data);
//     console.log("Request", requestBody);
//     if (!response.data.ForwardAwbNumber) {
//       console.error(
//         "Pincode is not serviceable at the moment, try again later",
//       );
//       return {
//         success: false,
//         error: "Pincode is not serviceable at the moment, try again later",
//       };
//     }
//     const awbNumber = response.data.ForwardAwbNumber;
//     const updatedOrder = await prisma.orders.update({
//       where: { id: dbOrder.id },
//       data: {
//         status: OrderStatus.READY_TO_SHIP,
//         awbNumber: awbNumber,
//         deliveryPartner: orderData.selectedPartner,
//         shippingDate: new Date(),
//       },
//     });
//     revalidatePath("/orders");
//     const safeToNumber = (
//       value: Prisma.Decimal | null | undefined,
//     ): number | null => {
//       return value ? value.toNumber() : null;
//     };
//     return {
//       success: true,
//       order: {
//         ...updatedOrder,
//         deadWeight: safeToNumber(updatedOrder.deadWeight),
//         breadth: safeToNumber(updatedOrder.breadth),
//         height: safeToNumber(updatedOrder.height),
//         length: safeToNumber(updatedOrder.length),
//         applicableWeight: safeToNumber(updatedOrder.applicableWeight),
//         totalOrderValue: safeToNumber(updatedOrder.totalOrderValue),
//       },
//       awbNumber: awbNumber,
//       clientOrderNumber: dbOrder.id.toString(),
//     };
//   } catch (error: any) {
//     console.error("Error in createAbhilayaOrder:", error);
//     let errorMessage = "An unknown error occurred";
//     if (error.response?.data) {
//       errorMessage =
//         "Pincode is not serviceable at the moment, try again later";
//     } else if (error instanceof Error) {
//       errorMessage = error.message;
//     }
//     return { success: false, error: errorMessage };
//   }
// }
// export async function cancelAbhilayaOrder(awbNumber: string) {
//   try {
//     const token = await getDeliveryPartnerToken("abhilaya");
//     console.log({
//       data: "Cancelling Abhilaya order",
//       path: "deliveryPartner/abhilaya",
//     });
//     const requestBody = {
//       TrackingNumber: awbNumber,
//     };
//     const response = await axios.post(
//       "http://oneworld.isopronto.com/api/Odn/CancelOrder",
//       requestBody,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       },
//     );
//     console.log(
//       JSON.stringify({
//         data: "Abhilaya Cancel API Response:",
//         responseData: response.data,
//         path: "deliveryPartner/abhilaya",
//       }),
//     );
//     if (response.data.SuccessMassage) {
//       console.log({
//         data: "Order cancellation successful",
//         path: "deliveryPartner/abhilaya",
//       });
//       // revalidatePath("/orders");
//       return {
//         success: true,
//         message: response.data.SuccessMassage,
//         trackingNumber: response.data.TrackingNumber,
//       };
//     } else {
//       console.error(
//         JSON.stringify({
//           message: `Failed to cancel order: ${
//             response.data.SuccessMassage || "Unknown error"
//           }`,
//           path: "/deliveryPartners/abhilaya.ts",
//         }),
//       );
//       return {
//         success: false,
//         error: response.data.SuccessMassage || "Unknown error",
//       };
//     }
//   } catch (error: any) {
//     console.error(
//       JSON.stringify({
//         message: `Error cancelling Abhilaya order: ${error}`,
//         path: "/deliveryPartners/abhilaya.ts",
//       }),
//     );
//     return {
//       success: false,
//       error:
//         error.response?.data?.SuccessMassage ||
//         error.message ||
//         "Failed to cancel Abhilaya order",
//     };
//   }
// }
