"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderId = generateOrderId;
exports.handleBulkOrderForApi = handleBulkOrderForApi;
exports.bulkOrders_with_3pl_preference_for_api = bulkOrders_with_3pl_preference_for_api;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
const address_1 = require("./address");
const selectPartner_1 = require("./selectPartner");
const user_1 = require("./user");
const transactions_1 = require("./transactions");
const deliveryPartners_1 = require("./deliveryPartners");
const sendMessage_1 = require("./sendMessage");
function generateOrderId() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const counter = yield prisma_1.default.globalOrderCounter.upsert({
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
        }
        catch (error) {
            console.error("Error generating order ID:", error);
            throw new Error("Error generating order ID");
        }
    });
}
function handleBulkOrderForApi(data, messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield bulkOrders_with_3pl_preference_for_api(data, messageId);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error,
            };
        }
    });
}
function bulkOrders_with_3pl_preference_for_api(data, messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        "use server";
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const startTime = Date.now();
        const orderResponses = [];
        let insufficientBalance = false;
        let processedOrders = 0;
        try {
            // Authenticate current user
            const user = yield prisma_1.default.users.findUnique({
                where: { userid: data.orderData.usersId },
                select: {
                    buddyShield: true,
                },
            });
            const userBuddyShieldStatus = (user === null || user === void 0 ? void 0 : user.buddyShield) || false;
            // Cache currentUser
            const currentUser = yield (0, user_1.fetchUserData)(data.orderData.usersId);
            if (!currentUser) {
                return { success: false, message: "No current user found", messageId: messageId };
            }
            // Get user's partner preferences
            const userPartnerPreferences = yield (0, user_1.getUserPartnerPreferences)(currentUser);
            console.log(`User partner preferences: ${userPartnerPreferences.join(", ")}`);
            if (userPartnerPreferences.length === 0) {
                return { success: false, message: "Please select partner preferences", messageId: messageId };
            }
            // Fetch pickup addresses
            const pickupAddresses = yield prisma_1.default.address.findMany({
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
            const responseWarehouse = yield (0, address_1.getWarehouseDetails)(data.orderData.warehouseName, data.orderData.usersId);
            try {
                const pickupAddress = pickupAddressMap.get(data.orderData.warehouseName.toLowerCase());
                if (!pickupAddress) {
                    console.log(`No valid pickup address found for tag: ${data.orderData.warehouseName}`);
                    orderResponses.push({
                        orderId: ((_a = data.orderData.orderId) === null || _a === void 0 ? void 0 : _a.toString()) || "N/A",
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
                    const selectedPartners = yield (0, selectPartner_1.selectPartnerForApi)(data, responseWarehouse.data[0], userPartnerPreferences);
                    console.log("Selected partners:", selectedPartners);
                    if (!selectedPartners || selectedPartners.length === 0) {
                        orderResponses.push({
                            orderId: ((_b = data.orderData.orderId) === null || _b === void 0 ? void 0 : _b.toString()) || "N/A",
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
                    const orderId = yield generateOrderId();
                    // Create the order, customer details, and packages BEFORE entering the retry loop
                    const newOrder = yield prisma_1.default.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                        // Create the order
                        const order = yield prisma.orders.create({
                            data: {
                                orderId: orderId,
                                usersId: data.orderData.usersId,
                                status: client_1.OrderStatus.NEW, // Initial status is NEW
                                shippingDate: new Date(),
                                paymentMode: data.orderData.paymentMode,
                                deadWeight: data.orderData.applicableWeight || 0.5,
                                length: data.orderData.length || 10,
                                breadth: data.orderData.breadth || 10,
                                height: data.orderData.height || 10,
                                totalOrderValue: data.orderData.totalOrderValue || 0,
                                applicableWeight: data.orderData.applicableWeight || 0.5,
                                isDangerous: data.orderData.isDangerousGoods === "y" ? true : false,
                                agentAddressId: data.orderData.agentAddressId,
                                deliveryType: "FORWARD",
                                rtoAgentAddressId: data.orderData.rtoAgentAddressId,
                                buddyshieldBoolean: data.orderData.buddyShield,
                            },
                        });
                        // Create customer address
                        const customerAddress = yield prisma.customerAddress.create({
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
                        yield prisma.orders.update({
                            where: { id: order.id },
                            data: { forwardCustomerId: customerAddress.customerId },
                        });
                        // Create packages
                        for (const pkg of data.packageList) {
                            yield prisma.packages.create({
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
                    }));
                    console.log(`Order created successfully with orderId: ${newOrder.orderId}`);
                    // Retry logic for creating shipping orders
                    let shippingOrderCreated = false;
                    let currentPartnerIndex = 0;
                    while (!shippingOrderCreated &&
                        currentPartnerIndex < selectedPartners.length) {
                        const selectedPartner = selectedPartners[currentPartnerIndex];
                        console.log(`Attempting to create shipping order with partner: ${selectedPartner}`);
                        try {
                            // Prepare rate calculation data
                            const rateData = {
                                pickupPin: responseWarehouse.data[0].pincode.toString(),
                                deliveryPin: data.customerAddressList.pincode.toString(),
                                actualWeight: ((_c = data.orderData.deadWeight) === null || _c === void 0 ? void 0 : _c.toString()) || "0.5",
                                length: data.orderData.length.toString() || "10",
                                breadth: ((_d = data.orderData.breadth) === null || _d === void 0 ? void 0 : _d.toString()) || "10",
                                height: ((_e = data.orderData.height) === null || _e === void 0 ? void 0 : _e.toString()) || "10",
                                paymentType: data.orderData.paymentMode || "prepaid",
                                volumetricWeight: (Number(data.orderData.length) *
                                    Number(data.orderData.breadth) *
                                    Number(data.orderData.height)) /
                                    5000,
                                applicableWeight: parseFloat(((_f = data.orderData.applicableWeight) === null || _f === void 0 ? void 0 : _f.toString()) || "0.5"),
                                shipmentValue: ((_g = data.orderData.totalOrderValue) === null || _g === void 0 ? void 0 : _g.toString()) || "0",
                                userId: data.orderData.usersId,
                                isReverse: false,
                                isDangerousGoods: data.orderData.isDangerousGoods === "y" ? true : false,
                            };
                            // Rates are coming from api.
                            // http://localhost:3001/api/seller/rates
                            const response = yield fetch("https://api.shypbuddy.net/api/seller/rates", {
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
                            });
                            const ratesApi = yield response.json();
                            const rates = ratesApi.rate.data[0];
                            if (!rates) {
                                console.error(`No rates available for partner: ${selectedPartner}`);
                                currentPartnerIndex++;
                                continue;
                            }
                            const selectedPartnerRate = rates;
                            if (!selectedPartnerRate) {
                                console.error(`No rates available for partner: ${selectedPartner}`);
                                currentPartnerIndex++;
                                continue;
                            }
                            // Check wallet balance
                            const walletBalance = yield (0, transactions_1.OrderBalanceApi)(selectedPartnerRate.totalRate, newOrder.id, data.orderData.usersId);
                            if ((walletBalance === null || walletBalance === void 0 ? void 0 : walletBalance.status) !== "OK") {
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
                            const shippingOrder = yield (0, deliveryPartners_1.createShippingOrderApi)(newOrder.id, selectedPartner);
                            if (shippingOrder.success && shippingOrder.awbNumber) {
                                // Update order status and AWB number
                                let b = yield prisma_1.default.orders.update({
                                    where: { id: newOrder.id },
                                    data: {
                                        status: client_1.OrderStatus.READY_TO_SHIP,
                                        awbNumber: shippingOrder.awbNumber,
                                        Zone: ((_h = rates[0]) === null || _h === void 0 ? void 0 : _h.Type) || null,
                                        deliveryPartner: selectedPartner.toLowerCase() === "ats" ||
                                            selectedPartner.toLowerCase() ===
                                                "ats (amazon transportation services)"
                                            ? "ats (amazon transportation services)"
                                            : selectedPartner,
                                        orderRate: selectedPartnerRate
                                            ? selectedPartnerRate.totalRate
                                            : 0,
                                        CODcharges: selectedPartnerRate.COD,
                                        shipmentCreationDate: new Date(),
                                    },
                                });
                                console.log("before deduction ================================================");
                                console.log("Line 1448 ", b);
                                // Deduct wallet balance
                                if (b.status === client_1.OrderStatus.READY_TO_SHIP) {
                                    const deduction = yield (0, transactions_1.OrderDeductionApi)(b.orderRate, b.orderId, b.awbNumber || "", walletBalance.Mode, walletBalance.balance, data.orderData.usersId);
                                    console.log(deduction, "deduction ================================================");
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
                                    yield (0, sendMessage_1.sendOrderSMS)(newOrder.orderId, currentUser);
                                }
                                catch (smsError) {
                                    console.error(`Error sending SMS notification for order ${newOrder.id}:`, smsError);
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
                            }
                            else {
                                console.error(`Failed to create shipping order for partner: ${selectedPartner}`);
                                currentPartnerIndex++; // Retry with the next partner
                            }
                        }
                        catch (error) {
                            console.error(`Error processing order with partner ${selectedPartner}:`, error);
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
            }
            catch (error) {
                console.error(`Error processing order ${data.orderData.orderId}:`, error);
                orderResponses.push({
                    orderId: ((_j = data.orderData.orderId) === null || _j === void 0 ? void 0 : _j.toString()) || "N/A",
                    status: "failed",
                    messageId: messageId,
                    userId: data.orderData.usersId,
                    message: error instanceof Error ? error.message : "Unknown error occurred",
                });
            }
            // Return the final result
            const successCount = Array.isArray(orderResponses)
                ? orderResponses.filter((response) => { var _a; return ((_a = response.status) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) === "success"; }).length
                : 0;
            return {
                fileName: "preference",
                success: successCount > 0,
                message: successCount > 0
                    ? `Successfully created and processed ${successCount} orders.`
                    : "No orders were successfully processed.",
                orderResponses,
                insufficientBalance,
                processedOrders,
                messageId: messageId
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error creating and processing orders: ${error instanceof Error ? error.message : "Unknown error"}`,
                orderResponses,
                insufficientBalance: true,
                processedOrders,
                messageId: messageId
            };
        }
    });
}
