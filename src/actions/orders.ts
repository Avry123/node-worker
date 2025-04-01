import { OrderStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { BulkOrderResult, CompleteOrderTypeApi, OrderResponse } from "../types/ordersType";
import { getWarehouseDetails } from "./address";
import { selectPartnerForApi } from "./selectPartner";
import { fetchUserData, getUserPartnerPreferences } from "./user";
import { OrderBalanceApi, OrderDeductionApi } from "./transactions";
import { createShippingOrderApi } from "./deliveryPartners";
import { sendOrderSMS } from "./sendMessage";

export async function generateOrderId(): Promise<number> {
  try {
    const counter = await prisma.globalOrderCounter.upsert({
      where: { id: 1 },
      update: {
        lastId: {
          increment: 1,
        },
      },
      create: {
        id: 1,
        lastId: 1001,
      },
    });

    return counter.lastId;
  } catch (error) {
    console.error("Error generating order ID:", error);
    throw new Error("Error generating order ID");
  }
}


export async function handleBulkOrderForApi(data: CompleteOrderTypeApi,messageId: string) {
    try {
    
      const result = await bulkOrders_with_3pl_preference_for_api(data, messageId);
    
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error,
      };
    }
  }

  export async function bulkOrders_with_3pl_preference_for_api(
    data: CompleteOrderTypeApi,
    messageId: string,
  ): Promise<BulkOrderResult> {
    "use server";
    const startTime = Date.now();
    const orderResponses: OrderResponse[] = [];
    let insufficientBalance = false;
    let processedOrders = 0;
  
    try {
      // Authenticate current user
      const user = await prisma.users.findUnique({
        where: { userid: data.orderData.usersId },
        select: {
          buddyShield: true,
        },
      });
      const userBuddyShieldStatus = user?.buddyShield || false;

      // Cache currentUser
      const currentUser = await fetchUserData(data.orderData.usersId);
      if (!currentUser) {
        return { success: false, message: "No current user found", messageId: messageId };
      }

      
  
      // Get user's partner preferences
      const userPartnerPreferences = await getUserPartnerPreferences(currentUser);
      console.log(
        `User partner preferences: ${userPartnerPreferences.join(", ")}`,
      );
      if (userPartnerPreferences.length === 0) {
        return { success: false, message: "Please select partner preferences", messageId: messageId };
      }
  
      // Fetch pickup addresses
      const pickupAddresses = await prisma.address.findMany({
        where: { userid: data.orderData.usersId },
      });
      if (pickupAddresses.length === 0) {
        return {
          success: false,
          message: "Please create a warehouse before placing orders.",
          messageId: messageId
        };
      }
  
      const pickupAddressMap = new Map(pickupAddresses.map((a) => [a.tag, a]));
  
      // Get warehouse details
      const responseWarehouse = await getWarehouseDetails(
        data.orderData.warehouseName,
        data.orderData.usersId,
      );
  
      try {
        const pickupAddress = pickupAddressMap.get(
          data.orderData.warehouseName.toLowerCase(),
        );
        if (!pickupAddress) {
          console.log(
            `No valid pickup address found for tag: ${data.orderData.warehouseName}`,
          );
          orderResponses.push({
            orderId: data.orderData.orderId?.toString() || "N/A",
            status: "failed",
            message: `No valid pickup address found for tag: ${data.orderData.warehouseName}`,
            messageId: messageId,
            userId: data.orderData.usersId,
          });
          return {
            success: false,
            message: "Invalid pickup address",
            orderResponses,
            messageId: messageId
          };
        }

        console.log('Line 130 ', userPartnerPreferences);
  
        // Select delivery partners
        if (responseWarehouse.data && responseWarehouse.data.length > 0) {
          const selectedPartners = await selectPartnerForApi(
            data,
            responseWarehouse.data[0],
            userPartnerPreferences,
          );
  
          console.log("Selected partners:", selectedPartners);
  
          if (!selectedPartners || selectedPartners.length === 0) {
            orderResponses.push({
              orderId: data.orderData.orderId?.toString() || "N/A",
              status: "failed",
              messageId: messageId,
              userId: data.orderData.usersId,
              message: `No serviceable partner found for Pickup Pincode ${data.orderData.warehouseName} and Delivery Pincode ${responseWarehouse.data[0].pincode}`,
            });
            return {
              success: false,
              message: "No serviceable partners",
              orderResponses,
              messageId: messageId
            };
          }
  
          // Generate order ID
          const orderId = await generateOrderId();
  
          // Create the order, customer details, and packages BEFORE entering the retry loop
          const newOrder = await prisma.$transaction(async (prisma) => {
            // Create the order
            const order = await prisma.orders.create({
              data: {
                orderId: orderId,
                usersId: data.orderData.usersId,
                status: OrderStatus.NEW, // Initial status is NEW
                shippingDate: new Date(),
                paymentMode: data.orderData.paymentMode,
                deadWeight: data.orderData.applicableWeight || 0.5,
                length: data.orderData.length || 10,
                breadth: data.orderData.breadth || 10,
                height: data.orderData.height || 10,
                totalOrderValue: data.orderData.totalOrderValue || 0,
                applicableWeight: data.orderData.applicableWeight || 0.5,
                isDangerous:
                  data.orderData.isDangerousGoods === "y" ? true : false,
                agentAddressId: data.orderData.agentAddressId,
                deliveryType: "FORWARD",
                rtoAgentAddressId: data.orderData.rtoAgentAddressId,
                buddyshieldBoolean: data.orderData.buddyShield,
              },
            });

            
  
            // Create customer address
            const customerAddress = await prisma.customerAddress.create({
              data: {
                orderId: order.id,
                fullName: data.customerAddressList.fullName,
                contactNumber: data.customerAddressList.contactNumber,
                email: data.customerAddressList.email || "",
                alternateNumber: data.customerAddressList.alternateNumber || "",
                address: data.customerAddressList.address,
                landmark: data.customerAddressList.landmark || "",
                pincode: data.customerAddressList.pincode || 0,
                city: data.customerAddressList.city,
                state: data.customerAddressList.state,
                country: "India",
              },
            });
  
            // Update order with customer address
            await prisma.orders.update({
              where: { id: order.id },
              data: { forwardCustomerId: customerAddress.customerId },
            });
  
            // Create packages
            for (const pkg of data.packageList) {
              await prisma.packages.create({
                data: {
                  orderId: order.id,
                  productName: pkg.name,
                  quantity: pkg.qty || 1,
                  price: pkg.price.toString() || "0",
                  hsn: pkg.hsnCode || "",
                  sku: pkg.sku || "",
                },
              });
            }
  
            return order;
          });
  
          console.log(
            `Order created successfully with orderId: ${newOrder.orderId}`,
          );
  
          // Retry logic for creating shipping orders
          let shippingOrderCreated = false;
          let currentPartnerIndex = 0;
  
          while (
            !shippingOrderCreated &&
            currentPartnerIndex < selectedPartners.length
          ) {
            const selectedPartner = selectedPartners[currentPartnerIndex];
            console.log(
              `Attempting to create shipping order with partner: ${selectedPartner}`,
            );
  
            try {
              // Prepare rate calculation data
              const rateData = {
                pickupPin: responseWarehouse.data[0].pincode.toString(),
                deliveryPin: data.customerAddressList.pincode.toString(),
                actualWeight: data.orderData.deadWeight?.toString() || "0.5",
                length: data.orderData.length.toString() || "10",
                breadth: data.orderData.breadth?.toString() || "10",
                height: data.orderData.height?.toString() || "10",
                paymentType: data.orderData.paymentMode || "prepaid",
                volumetricWeight:
                  (Number(data.orderData.length) *
                    Number(data.orderData.breadth) *
                    Number(data.orderData.height)) /
                  5000,
                applicableWeight: parseFloat(
                  data.orderData.applicableWeight?.toString() || "0.5",
                ),
                shipmentValue: data.orderData.totalOrderValue?.toString() || "0",
                userId: data.orderData.usersId,
                isReverse: false,
                isDangerousGoods:
                  data.orderData.isDangerousGoods === "y" ? true : false,
              };
  
             
  
              // Rates are coming from api.
              // http://localhost:3001/api/seller/rates
              const response = await fetch(
                "https://api.shypbuddy.net/api/seller/rates",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    deliveryData: {
                      pickupPin: rateData.pickupPin,
                      deliveryPin: rateData.deliveryPin,
                      actualWeight: rateData.actualWeight,
                      length: rateData.length,
                      breadth: rateData.breadth,
                      height: rateData.height,
                      paymentType: rateData.paymentType,
                      volumetricWeight: rateData.volumetricWeight,
                      applicableWeight: rateData.applicableWeight,
                      shipmentValue: rateData.shipmentValue,
                      isDangerousGoods: rateData.isDangerousGoods,
                      userId: rateData.userId,
                      isReverse: rateData.isReverse,
                    },
                    selectedPartner: selectedPartner,
                  }),
                },
              );
  
              const ratesApi = await response.json();
             
              const rates = ratesApi.rate.data[0];
              if (!rates) {
                console.error(
                  `No rates available for partner: ${selectedPartner}`,
                );
                currentPartnerIndex++;
                continue;
              }
  
              const selectedPartnerRate = rates;
              
              if (!selectedPartnerRate) {
                console.error(
                  `No rates available for partner: ${selectedPartner}`,
                );
                currentPartnerIndex++;
                continue;
              }
  
              // Check wallet balance
              const walletBalance = await OrderBalanceApi(
                selectedPartnerRate.totalRate as any,
                newOrder.id,
                data.orderData.usersId,
              );
              
  
              if (walletBalance?.status !== "OK") {
                insufficientBalance = true;
                orderResponses.push({
                  orderId: newOrder.orderId.toString(),
                  status: "failed",
                  message: "Insufficient wallet balance",
                  userId: data.orderData.usersId,
                  messageId: messageId
                });
                break;
              }
  
              // Create shipping order
              const shippingOrder = await createShippingOrderApi(
                newOrder.id,
                selectedPartner,
              );
             
              if (shippingOrder.success && shippingOrder.awbNumber) {
              
                // Update order status and AWB number
                let b = await prisma.orders.update({
                  where: { id: newOrder.id },
                  data: {
                    status: OrderStatus.READY_TO_SHIP,
                    awbNumber: shippingOrder.awbNumber,
                    Zone: rates[0]?.Type || null,
                    deliveryPartner:
                      selectedPartner.toLowerCase() === "ats" ||
                      selectedPartner.toLowerCase() ===
                        "ats (amazon transportation services)"
                        ? "ats (amazon transportation services)"
                        : selectedPartner,
                    orderRate: selectedPartnerRate
                      ? selectedPartnerRate.totalRate
                      : 0,
                    CODcharges: selectedPartnerRate.COD ,
                    shipmentCreationDate: new Date(),
                  },
                });
  
                console.log(
                  "before deduction ================================================",
                );
                console.log("Line 1448 ", b);
                // Deduct wallet balance
                if (b.status === OrderStatus.READY_TO_SHIP) {
                  const deduction = await OrderDeductionApi(
                    b.orderRate,
                    b.orderId,
                    b.awbNumber || "",
                    walletBalance.Mode,
                    walletBalance.balance,
                    data.orderData.usersId,
                  );
  
                  console.log(
                    deduction,
                    "deduction ================================================",
                  );
  
                  if (deduction.status === "FAILED") {
                    orderResponses.push({
                      orderId: newOrder.orderId.toString(),
                      status: "failed",
                      message: "Failed to deduct wallet balance",
                      messageId: messageId,
                      userId: data.orderData.usersId,
                    });
                    break;
                  }
                }
  
                // Send SMS notification
                try {
                  await sendOrderSMS(newOrder.orderId, currentUser);
                } catch (smsError) {
                  console.error(
                    `Error sending SMS notification for order ${newOrder.id}:`,
                    smsError,
                  );
                }
  
                // Add success response
                orderResponses.push({
                  orderId: newOrder.orderId.toString(),
                  status: "success",
                  message: "Order created successfully",
                  awbNumber: shippingOrder.awbNumber,
                  amountDeducted: selectedPartnerRate
                    ? selectedPartnerRate.totalRate
                    : 0,
                  deliveryPartner: selectedPartner,
                  messageId: messageId,
                  userId: data.orderData.usersId
                });
  
                processedOrders++;
                shippingOrderCreated = true; // Terminate the loop
              } else {
                console.error(
                  `Failed to create shipping order for partner: ${selectedPartner}`,
                );
                currentPartnerIndex++; // Retry with the next partner
              }
            } catch (error) {
              console.error(
                `Error processing order with partner ${selectedPartner}:`,
                error,
              );
              currentPartnerIndex++; // Retry with the next partner
            }
          }
  
          // If no shipping order was created after exhausting all partners
          if (!shippingOrderCreated) {
            // Update the order status to FAILED
  
            // Add failure response
            orderResponses.push({
              orderId: newOrder.id.toString() || "N/A",
              status: "failed",
              messageId: messageId,
              userId: data.orderData.usersId,
              message: `None of the delivery partners provided service for this order. Order is stored in NEW bucket the orderId is ${newOrder.id} `,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing order ${data.orderData.orderId}:`, error);
        orderResponses.push({
          orderId: data.orderData.orderId?.toString() || "N/A",
          status: "failed",
          messageId: messageId,
          userId: data.orderData.usersId,
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
  
      // Return the final result
      const successCount = Array.isArray(orderResponses)
        ? orderResponses.filter(
            (response) => response.status?.trim().toLowerCase() === "success",
          ).length
        : 0;
  
      return {
        fileName: "preference",
        success: successCount > 0,
        message:
          successCount > 0
            ? `Successfully created and processed ${successCount} orders.`
            : "No orders were successfully processed.",
        orderResponses,
        insufficientBalance,
        processedOrders,
        messageId: messageId
      };
    } catch (error) {
      return {
        success: false,
        message: `Error creating and processing orders: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        orderResponses,
        insufficientBalance: true,
        processedOrders,
        messageId: messageId
      };
    }
  }