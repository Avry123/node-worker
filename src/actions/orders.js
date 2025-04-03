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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderId = generateOrderId;
exports.handleBulkOrderForApi = handleBulkOrderForApi;
exports.bulkOrders_with_3pl_preference_for_api = bulkOrders_with_3pl_preference_for_api;
var client_1 = require("@prisma/client");
var prisma_1 = require("../lib/prisma");
var address_1 = require("./address");
var selectPartner_1 = require("./selectPartner");
var user_1 = require("./user");
var transactions_1 = require("./transactions");
var deliveryPartners_1 = require("./deliveryPartners");
var sendMessage_1 = require("./sendMessage");
function generateOrderId() {
    return __awaiter(this, void 0, void 0, function () {
        var counter, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_1.default.globalOrderCounter.upsert({
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
                        })];
                case 1:
                    counter = _a.sent();
                    return [2 /*return*/, counter.lastId];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error generating order ID:", error_1);
                    throw new Error("Error generating order ID");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function handleBulkOrderForApi(data, messageId) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, bulkOrders_with_3pl_preference_for_api(data, messageId)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            data: result,
                        }];
                case 2:
                    error_2 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            message: error_2,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function bulkOrders_with_3pl_preference_for_api(data, messageId) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var startTime, orderResponses, insufficientBalance, processedOrders, user, userBuddyShieldStatus, currentUser, userPartnerPreferences, pickupAddresses, pickupAddressMap, responseWarehouse, pickupAddress, selectedPartners, orderId_1, newOrder, shippingOrderCreated, currentPartnerIndex, selectedPartner, rateData, response, ratesApi, rates, selectedPartnerRate, walletBalance, shippingOrder, b, deduction, smsError_1, error_3, error_4, successCount, error_5;
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    startTime = Date.now();
                    orderResponses = [];
                    insufficientBalance = false;
                    processedOrders = 0;
                    _k.label = 1;
                case 1:
                    _k.trys.push([1, 31, , 32]);
                    return [4 /*yield*/, prisma_1.default.users.findUnique({
                            where: { userid: data.orderData.usersId },
                            select: {
                                buddyShield: true,
                            },
                        })];
                case 2:
                    user = _k.sent();
                    userBuddyShieldStatus = (user === null || user === void 0 ? void 0 : user.buddyShield) || false;
                    return [4 /*yield*/, (0, user_1.fetchUserData)(data.orderData.usersId)];
                case 3:
                    currentUser = _k.sent();
                    if (!currentUser) {
                        return [2 /*return*/, { success: false, message: "No current user found", messageId: messageId }];
                    }
                    return [4 /*yield*/, (0, user_1.getUserPartnerPreferences)(currentUser)];
                case 4:
                    userPartnerPreferences = _k.sent();
                    console.log("User partner preferences: ".concat(userPartnerPreferences.join(", ")));
                    if (userPartnerPreferences.length === 0) {
                        return [2 /*return*/, { success: false, message: "Please select partner preferences", messageId: messageId }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findMany({
                            where: { userid: data.orderData.usersId },
                        })];
                case 5:
                    pickupAddresses = _k.sent();
                    if (pickupAddresses.length === 0) {
                        return [2 /*return*/, {
                                success: false,
                                message: "Please create a warehouse before placing orders.",
                                messageId: messageId
                            }];
                    }
                    pickupAddressMap = new Map(pickupAddresses.map(function (a) { return [a.tag, a]; }));
                    return [4 /*yield*/, (0, address_1.getWarehouseDetails)(data.orderData.warehouseName, data.orderData.usersId)];
                case 6:
                    responseWarehouse = _k.sent();
                    _k.label = 7;
                case 7:
                    _k.trys.push([7, 29, , 30]);
                    pickupAddress = pickupAddressMap.get(data.orderData.warehouseName.toLowerCase());
                    if (!pickupAddress) {
                        console.log("No valid pickup address found for tag: ".concat(data.orderData.warehouseName));
                        orderResponses.push({
                            orderId: ((_a = data.orderData.orderId) === null || _a === void 0 ? void 0 : _a.toString()) || "N/A",
                            status: "failed",
                            message: "No valid pickup address found for tag: ".concat(data.orderData.warehouseName),
                            messageId: messageId,
                            userId: data.orderData.usersId,
                        });
                        return [2 /*return*/, {
                                success: false,
                                message: "Invalid pickup address",
                                orderResponses: orderResponses,
                                messageId: messageId
                            }];
                    }
                    console.log('Line 130 ', userPartnerPreferences);
                    if (!(responseWarehouse.data && responseWarehouse.data.length > 0)) return [3 /*break*/, 28];
                    return [4 /*yield*/, (0, selectPartner_1.selectPartnerForApi)(data, responseWarehouse.data[0], userPartnerPreferences)];
                case 8:
                    selectedPartners = _k.sent();
                    console.log("Selected partners:", selectedPartners);
                    if (!selectedPartners || selectedPartners.length === 0) {
                        orderResponses.push({
                            orderId: ((_b = data.orderData.orderId) === null || _b === void 0 ? void 0 : _b.toString()) || "N/A",
                            status: "failed",
                            messageId: messageId,
                            userId: data.orderData.usersId,
                            message: "No serviceable partner found for Pickup Pincode ".concat(data.orderData.warehouseName, " and Delivery Pincode ").concat(responseWarehouse.data[0].pincode),
                        });
                        return [2 /*return*/, {
                                success: false,
                                message: "No serviceable partners",
                                orderResponses: orderResponses,
                                messageId: messageId
                            }];
                    }
                    return [4 /*yield*/, generateOrderId()];
                case 9:
                    orderId_1 = _k.sent();
                    return [4 /*yield*/, prisma_1.default.$transaction(function (prisma) { return __awaiter(_this, void 0, void 0, function () {
                            var order, customerAddress, _i, _a, pkg;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, prisma.orders.create({
                                            data: {
                                                orderId: orderId_1,
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
                                        })];
                                    case 1:
                                        order = _b.sent();
                                        return [4 /*yield*/, prisma.customerAddress.create({
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
                                            })];
                                    case 2:
                                        customerAddress = _b.sent();
                                        // Update order with customer address
                                        return [4 /*yield*/, prisma.orders.update({
                                                where: { id: order.id },
                                                data: { forwardCustomerId: customerAddress.customerId },
                                            })];
                                    case 3:
                                        // Update order with customer address
                                        _b.sent();
                                        _i = 0, _a = data.packageList;
                                        _b.label = 4;
                                    case 4:
                                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                                        pkg = _a[_i];
                                        return [4 /*yield*/, prisma.packages.create({
                                                data: {
                                                    orderId: order.id,
                                                    productName: pkg.name,
                                                    quantity: pkg.qty || 1,
                                                    price: pkg.price.toString() || "0",
                                                    hsn: pkg.hsnCode || "",
                                                    sku: pkg.sku || "",
                                                },
                                            })];
                                    case 5:
                                        _b.sent();
                                        _b.label = 6;
                                    case 6:
                                        _i++;
                                        return [3 /*break*/, 4];
                                    case 7: return [2 /*return*/, order];
                                }
                            });
                        }); })];
                case 10:
                    newOrder = _k.sent();
                    console.log("Order created successfully with orderId: ".concat(newOrder.orderId));
                    shippingOrderCreated = false;
                    currentPartnerIndex = 0;
                    _k.label = 11;
                case 11:
                    if (!(!shippingOrderCreated &&
                        currentPartnerIndex < selectedPartners.length)) return [3 /*break*/, 27];
                    selectedPartner = selectedPartners[currentPartnerIndex];
                    console.log("Attempting to create shipping order with partner: ".concat(selectedPartner));
                    _k.label = 12;
                case 12:
                    _k.trys.push([12, 25, , 26]);
                    rateData = {
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
                    return [4 /*yield*/, fetch("https://api.shypbuddy.net/api/seller/rates", {
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
                        })];
                case 13:
                    response = _k.sent();
                    return [4 /*yield*/, response.json()];
                case 14:
                    ratesApi = _k.sent();
                    rates = ratesApi.rate.data[0];
                    if (!rates) {
                        console.error("No rates available for partner: ".concat(selectedPartner));
                        currentPartnerIndex++;
                        return [3 /*break*/, 11];
                    }
                    selectedPartnerRate = rates;
                    if (!selectedPartnerRate) {
                        console.error("No rates available for partner: ".concat(selectedPartner));
                        currentPartnerIndex++;
                        return [3 /*break*/, 11];
                    }
                    return [4 /*yield*/, (0, transactions_1.OrderBalanceApi)(selectedPartnerRate.totalRate, newOrder.id, data.orderData.usersId)];
                case 15:
                    walletBalance = _k.sent();
                    if ((walletBalance === null || walletBalance === void 0 ? void 0 : walletBalance.status) !== "OK") {
                        insufficientBalance = true;
                        orderResponses.push({
                            orderId: newOrder.orderId.toString(),
                            status: "failed",
                            message: "Insufficient wallet balance",
                            userId: data.orderData.usersId,
                            messageId: messageId
                        });
                        return [3 /*break*/, 27];
                    }
                    return [4 /*yield*/, (0, deliveryPartners_1.createShippingOrderApi)(newOrder.id, selectedPartner)];
                case 16:
                    shippingOrder = _k.sent();
                    if (!(shippingOrder.success && shippingOrder.awbNumber)) return [3 /*break*/, 23];
                    return [4 /*yield*/, prisma_1.default.orders.update({
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
                        })];
                case 17:
                    b = _k.sent();
                    console.log("before deduction ================================================");
                    console.log("Line 1448 ", b);
                    if (!(b.status === client_1.OrderStatus.READY_TO_SHIP)) return [3 /*break*/, 19];
                    return [4 /*yield*/, (0, transactions_1.OrderDeductionApi)(b.orderRate, b.orderId, b.awbNumber || "", walletBalance.Mode, walletBalance.balance, data.orderData.usersId)];
                case 18:
                    deduction = _k.sent();
                    console.log(deduction, "deduction ================================================");
                    if (deduction.status === "FAILED") {
                        orderResponses.push({
                            orderId: newOrder.orderId.toString(),
                            status: "failed",
                            message: "Failed to deduct wallet balance",
                            messageId: messageId,
                            userId: data.orderData.usersId,
                        });
                        return [3 /*break*/, 27];
                    }
                    _k.label = 19;
                case 19:
                    _k.trys.push([19, 21, , 22]);
                    return [4 /*yield*/, (0, sendMessage_1.sendOrderSMS)(newOrder.orderId, currentUser)];
                case 20:
                    _k.sent();
                    return [3 /*break*/, 22];
                case 21:
                    smsError_1 = _k.sent();
                    console.error("Error sending SMS notification for order ".concat(newOrder.id, ":"), smsError_1);
                    return [3 /*break*/, 22];
                case 22:
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
                    return [3 /*break*/, 24];
                case 23:
                    console.error("Failed to create shipping order for partner: ".concat(selectedPartner));
                    currentPartnerIndex++; // Retry with the next partner
                    _k.label = 24;
                case 24: return [3 /*break*/, 26];
                case 25:
                    error_3 = _k.sent();
                    console.error("Error processing order with partner ".concat(selectedPartner, ":"), error_3);
                    currentPartnerIndex++; // Retry with the next partner
                    return [3 /*break*/, 26];
                case 26: return [3 /*break*/, 11];
                case 27:
                    // If no shipping order was created after exhausting all partners
                    if (!shippingOrderCreated) {
                        // Update the order status to FAILED
                        // Add failure response
                        orderResponses.push({
                            orderId: newOrder.id.toString() || "N/A",
                            status: "failed",
                            messageId: messageId,
                            userId: data.orderData.usersId,
                            message: "None of the delivery partners provided service for this order. Order is stored in NEW bucket the orderId is ".concat(newOrder.id, " "),
                        });
                    }
                    _k.label = 28;
                case 28: return [3 /*break*/, 30];
                case 29:
                    error_4 = _k.sent();
                    console.error("Error processing order ".concat(data.orderData.orderId, ":"), error_4);
                    orderResponses.push({
                        orderId: ((_j = data.orderData.orderId) === null || _j === void 0 ? void 0 : _j.toString()) || "N/A",
                        status: "failed",
                        messageId: messageId,
                        userId: data.orderData.usersId,
                        message: error_4 instanceof Error ? error_4.message : "Unknown error occurred",
                    });
                    return [3 /*break*/, 30];
                case 30:
                    successCount = Array.isArray(orderResponses)
                        ? orderResponses.filter(function (response) { var _a; return ((_a = response.status) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) === "success"; }).length
                        : 0;
                    return [2 /*return*/, {
                            fileName: "preference",
                            success: successCount > 0,
                            message: successCount > 0
                                ? "Successfully created and processed ".concat(successCount, " orders.")
                                : "No orders were successfully processed.",
                            orderResponses: orderResponses,
                            insufficientBalance: insufficientBalance,
                            processedOrders: processedOrders,
                            messageId: messageId
                        }];
                case 31:
                    error_5 = _k.sent();
                    return [2 /*return*/, {
                            success: false,
                            message: "Error creating and processing orders: ".concat(error_5 instanceof Error ? error_5.message : "Unknown error"),
                            orderResponses: orderResponses,
                            insufficientBalance: true,
                            processedOrders: processedOrders,
                            messageId: messageId
                        }];
                case 32: return [2 /*return*/];
            }
        });
    });
}
