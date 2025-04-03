"use server";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.createEkartOrder = createEkartOrder;
exports.CancelEkartOrder = CancelEkartOrder;
exports.createReverseEkartOrder = createReverseEkartOrder;
exports.CancelReverseEkartOrder = CancelReverseEkartOrder;
exports.createEkartNdr = createEkartNdr;
exports.createEkartRto = createEkartRto;
var axios_1 = require("axios");
var client_1 = require("@prisma/client");
// import { revalidatePath } from "next/cache";
// import { getDeliveryPartnerId } from "../orders"
var tokenManager_1 = require("./tokenManager");
var prisma_1 = require("../../lib/prisma");
function createEkartOrder(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        function generateTrackingId(isPrepaid) {
            // Format: 3 char merchant code (SHY) + C/P + 10 digits
            var merchantCode = "SHY";
            var paymentType = isPrepaid ? "P" : "C";
            // Generate a unique 10-digit number using timestamp and order ID
            var timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
            var orderPart = orderId.toString().padStart(4, "0").slice(-4); // Last 4 digits of order ID
            // Combine to create the 10-digit unique number
            var uniqueNumber = (orderPart + timestamp).slice(-10).padStart(10, "0");
            // Combine all parts: SHY + C/P + 10 digits = 14 characters total
            return "".concat(merchantCode).concat(paymentType).concat(uniqueNumber);
        }
        var token, order_1, warehouseAddress, customerAddress, safeToNumber, requestBody, response_1, result, error_1;
        var _this = this;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 8, , 9]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ekart")];
                case 1:
                    token = _f.sent();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
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
                        })];
                case 2:
                    order_1 = _f.sent();
                    if (!order_1) {
                        console.error("Order not found");
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findFirst({
                            where: {
                                id: order_1.agentAddressId || undefined,
                            },
                        })];
                case 3:
                    warehouseAddress = _f.sent();
                    if (!warehouseAddress) {
                        console.error("Warehouse address not found");
                        return [2 /*return*/, { success: false, error: "Warehouse address not found" }];
                    }
                    customerAddress = order_1.customerAddress;
                    if (!customerAddress) {
                        console.error("Customer address not found");
                        return [2 /*return*/, { success: false, error: "Customer address not found" }];
                    }
                    safeToNumber = function (value) {
                        return value ? value.toNumber() : 0;
                    };
                    requestBody = {
                        client_name: "SHY",
                        services: [
                            {
                                service_code: "Regular",
                                service_details: [
                                    {
                                        service_leg: "FORWARD",
                                        service_data: {
                                            vendor_name: "Ekart",
                                            amount_to_collect: ((_a = order_1.paymentMode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "cod" ? order_1.totalOrderValue : 0,
                                            delivery_type: "SMALL",
                                            source: {
                                                address: {
                                                    first_name: ((_b = order_1 === null || order_1 === void 0 ? void 0 : order_1.Users) === null || _b === void 0 ? void 0 : _b.StoreName) || warehouseAddress.tag,
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
                                                    first_name: ((_c = order_1 === null || order_1 === void 0 ? void 0 : order_1.Users) === null || _c === void 0 ? void 0 : _c.StoreName) || warehouseAddress.tag,
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
                                            tracking_id: generateTrackingId(((_d = order_1.paymentMode) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === "prepaid"),
                                            shipment_value: safeToNumber(order_1.totalOrderValue),
                                            shipment_dimensions: {
                                                length: {
                                                    value: safeToNumber(order_1.length),
                                                },
                                                breadth: {
                                                    value: safeToNumber(order_1.breadth),
                                                },
                                                height: {
                                                    value: safeToNumber(order_1.height),
                                                },
                                                weight: {
                                                    value: safeToNumber(order_1.applicableWeight),
                                                },
                                            },
                                            shipment_items: [
                                                {
                                                    quantity: order_1.Packages.length,
                                                    seller_details: {
                                                        seller_reg_name: ((_e = order_1 === null || order_1 === void 0 ? void 0 : order_1.Users) === null || _e === void 0 ? void 0 : _e.StoreName) || warehouseAddress.tag,
                                                    },
                                                    item_attributes: [
                                                        {
                                                            name: "order_id",
                                                            value: order_1.orderId.toString(),
                                                        },
                                                        {
                                                            name: "invoice_id",
                                                            value: order_1.totalOrderValue,
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
                    return [4 /*yield*/, axios_1.default.post("https://api.ekartlogistics.com/v2/shipments/create", requestBody, {
                            headers: {
                                Authorization: "".concat(token),
                                "Content-Type": "application/json",
                                HTTP_X_MERCHANT_CODE: "SHY",
                            },
                        })];
                case 4:
                    response_1 = _f.sent();
                    console.log(JSON.stringify(requestBody), "requestBody for ekart");
                    if (!(response_1.data.response[0].status === "REQUEST_RECEIVED")) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma_1.default.$transaction(function (prismaTransaction) { return __awaiter(_this, void 0, void 0, function () {
                            var updatedOrder;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prismaTransaction.orders.update({
                                            where: { id: order_1.id },
                                            data: {
                                                status: client_1.OrderStatus.READY_TO_SHIP,
                                                awbNumber: response_1.data.response[0].tracking_id,
                                                shippingDate: new Date(),
                                            },
                                        })];
                                    case 1:
                                        updatedOrder = _a.sent();
                                        return [2 /*return*/, updatedOrder];
                                }
                            });
                        }); })];
                case 5:
                    result = _f.sent();
                    // revalidatePath("/orders");
                    return [2 /*return*/, {
                            success: true,
                            order: __assign(__assign({}, result), { deadWeight: safeToNumber(result.deadWeight), breadth: safeToNumber(result.breadth), height: safeToNumber(result.height), length: safeToNumber(result.length), applicableWeight: safeToNumber(result.applicableWeight), totalOrderValue: safeToNumber(result.totalOrderValue) }),
                            awbNumber: response_1.data.response[0].tracking_id,
                        }];
                case 6:
                    console.error("Failed to create order with Ekart");
                    _f.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_1 = _f.sent();
                    console.error(JSON.stringify({
                        message: "Error in createEkartOrder:",
                        errorDetails: error_1,
                        path: "deliverypartner/ekart",
                    }, null, 2));
                    return [2 /*return*/, {
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : "An unknown error occurred",
                        }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function CancelEkartOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var token, requestBody, response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ekart")];
                case 1:
                    token = _a.sent();
                    console.log("Line 222 ", token);
                    requestBody = {
                        request_details: [
                            {
                                tracking_id: awbNumber,
                            },
                        ],
                    };
                    return [4 /*yield*/, axios_1.default.put("https://api.ekartlogistics.com/v2/shipments/rto/create", requestBody, {
                            headers: {
                                Authorization: "".concat(token),
                                "Content-Type": "application/json",
                                HTTP_X_MERCHANT_CODE: "SHY",
                            },
                        })];
                case 2:
                    response = _a.sent();
                    console.log(JSON.stringify("Order cancellation response:", response.data));
                    if ((response.data.reason = response.data.response[0].status_code === 200)) {
                        return [2 /*return*/, { success: true, message: "Order was successfully canceled" }];
                    }
                    return [2 /*return*/, { success: false, message: "Order cancellation failed" }];
                case 3:
                    error_2 = _a.sent();
                    console.error(JSON.stringify({
                        message: "Error cancelling Ekart order:",
                        errorDetails: error_2,
                        path: "deliverypartner/ekart",
                    }));
                    if (error_2.response && error_2.response.data) {
                        console.error(JSON.stringify({
                            message: "Error response data:",
                            errorDetails: error_2.response.data,
                            path: "deliverypartner/ekart",
                        }));
                    }
                    console.error("Failed to cancel Ekart order");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function generateRandomOrderId(orderId) {
    var randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return "".concat(orderId, "-").concat(randomNum);
}
function createReverseEkartOrder(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        function generateTrackingId(isPrepaid) {
            // Format: 3 char merchant code (SHY) + C/P + 10 digits
            var merchantCode = "SHY";
            var paymentType = isPrepaid ? "P" : "C";
            // Generate a unique 10-digit number using timestamp and order ID
            var timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
            var orderPart = orderId.toString().padStart(4, "0").slice(-4); // Last 4 digits of order ID
            // Combine to create the 10-digit unique number
            var uniqueNumber = (orderPart + timestamp).slice(-10).padStart(10, "0");
            // Combine all parts: SHY + C/P + 10 digits = 14 characters total
            return "".concat(merchantCode).concat(paymentType).concat(uniqueNumber);
        }
        var token, order_2, pickupAddress, customerAddress, safeToNumber, requestBody, response_2, result, error_3;
        var _this = this;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ekart")];
                case 1:
                    token = _c.sent();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { id: orderId },
                            include: {
                                Packages: true,
                                ReversePickupAddress: true,
                                reverseCustomerAddress: true,
                                Users: true,
                            },
                        })];
                case 2:
                    order_2 = _c.sent();
                    if (!order_2) {
                        console.error("Order not found");
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    pickupAddress = order_2.ReversePickupAddress;
                    if (!pickupAddress) {
                        console.error("Pickup address not found");
                        return [2 /*return*/, { success: false, error: "Pickup address not found" }];
                    }
                    customerAddress = order_2.reverseCustomerAddress;
                    if (!customerAddress) {
                        console.error("Customer address not found");
                        return [2 /*return*/, { success: false, error: "Customer address not found" }];
                    }
                    safeToNumber = function (value) {
                        return value ? value.toNumber() : 0;
                    };
                    requestBody = {
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
                                                    first_name: ((_a = order_2 === null || order_2 === void 0 ? void 0 : order_2.Users) === null || _a === void 0 ? void 0 : _a.StoreName) || customerAddress.tag,
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
                                            tracking_id: generateTrackingId(((_b = order_2.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "prepaid"),
                                            shipment_value: safeToNumber(order_2.totalOrderValue),
                                            shipment_dimensions: {
                                                length: {
                                                    value: safeToNumber(order_2.length),
                                                },
                                                breadth: {
                                                    value: safeToNumber(order_2.breadth),
                                                },
                                                height: {
                                                    value: safeToNumber(order_2.height),
                                                },
                                                weight: {
                                                    value: safeToNumber(order_2.applicableWeight),
                                                },
                                            },
                                            shipment_items: [
                                                {
                                                    quantity: order_2.Packages.length,
                                                    seller_details: {
                                                        seller_reg_name: pickupAddress.fullName,
                                                    },
                                                    item_attributes: [
                                                        {
                                                            name: "order_id",
                                                            value: generateRandomOrderId(order_2.orderId),
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
                    return [4 /*yield*/, axios_1.default.post("https://api.ekartlogistics.com/v2/shipments/create ", requestBody, {
                            headers: {
                                Authorization: "".concat(token),
                                "Content-Type": "application/json",
                                HTTP_X_MERCHANT_CODE: "SHY",
                            },
                        })];
                case 3:
                    response_2 = _c.sent();
                    if (!(response_2.data.response[0].status === "REQUEST_RECEIVED")) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma_1.default.$transaction(function (prismaTransaction) { return __awaiter(_this, void 0, void 0, function () {
                            var updatedOrder;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prismaTransaction.orders.update({
                                            where: { id: order_2.id },
                                            data: {
                                                status: client_1.OrderStatus.READY_TO_SHIP,
                                                awbNumber: response_2.data.response[0].tracking_id,
                                                shippingDate: new Date(),
                                            },
                                        })];
                                    case 1:
                                        updatedOrder = _a.sent();
                                        return [2 /*return*/, updatedOrder];
                                }
                            });
                        }); })];
                case 4:
                    result = _c.sent();
                    // revalidatePath("/orders");
                    return [2 /*return*/, {
                            success: true,
                            order: __assign(__assign({}, result), { deadWeight: safeToNumber(result.deadWeight), breadth: safeToNumber(result.breadth), height: safeToNumber(result.height), length: safeToNumber(result.length), applicableWeight: safeToNumber(result.applicableWeight), totalOrderValue: safeToNumber(result.totalOrderValue) }),
                            awbNumber: response_2.data.response[0].tracking_id,
                        }];
                case 5:
                    console.error(JSON.stringify({
                        message: "Failed to create order with Ekart: ".concat(response_2.data.response[0].message[0]),
                        path: "deliverypartner/ekart",
                    }));
                    _c.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_3 = _c.sent();
                    console.error(JSON.stringify({
                        message: "Error in createReverseEkartOrder:",
                        errorDetails: error_3,
                        path: "deliverypartner/ekart",
                    }, null, 2));
                    return [2 /*return*/, {
                            success: false,
                            error: error_3 instanceof Error ? error_3.message : "An unknown error occurred",
                        }];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function CancelReverseEkartOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var token, requestBody, response, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ekart")];
                case 1:
                    token = _a.sent();
                    requestBody = {
                        request_details: [
                            {
                                tracking_id: awbNumber,
                            },
                        ],
                    };
                    return [4 /*yield*/, axios_1.default.put("https://api.ekartlogistics.com/v2/shipments/rvp/cancel", requestBody, {
                            headers: {
                                Authorization: "".concat(token),
                                "Content-Type": "application/json",
                                HTTP_X_MERCHANT_CODE: "SHY",
                            },
                        })];
                case 2:
                    response = _a.sent();
                    //   console.log("Order cancellation response:", response.data);
                    if (response.data.response[0].status_code === 200) {
                        return [2 /*return*/, { success: true, message: "Order was successfully canceled" }];
                    }
                    return [2 /*return*/, { success: false, message: "Order cancellation failed" }];
                case 3:
                    error_4 = _a.sent();
                    console.error(JSON.stringify({
                        message: "Error in cancel reverse for ekart:",
                        errorDetails: error_4,
                        path: "deliverypartner/ekart",
                    }));
                    if (error_4.response && error_4.response.data) {
                        console.error(JSON.stringify({
                            message: "Error response data:",
                            errorDetails: error_4.response.data,
                            path: "deliverypartner/ekart",
                        }));
                    }
                    return [2 /*return*/, { success: false, message: " Ekart Order cancellation failed" }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createEkartNdr(order, data) {
    return __awaiter(this, void 0, void 0, function () {
        var token, orders, updateResult, rescheduleResult, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting createEkartNdr for order:", order);
                    console.log("Data:", data);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ekart")];
                case 2:
                    token = _a.sent();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { orderId: Number(order.orderId) },
                            include: {
                                customerAddress: true,
                            },
                        })];
                case 3:
                    orders = _a.sent();
                    ;
                    if (!orders) {
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    if (!(data.address || data.phone)) return [3 /*break*/, 5];
                    return [4 /*yield*/, updateCustomerDetails(orders, data, token)];
                case 4:
                    updateResult = _a.sent();
                    if (!updateResult.success) {
                        return [2 /*return*/, updateResult];
                    }
                    _a.label = 5;
                case 5: return [4 /*yield*/, rescheduleDelivery(order.awbNumber, token)];
                case 6:
                    rescheduleResult = _a.sent();
                    if (!rescheduleResult.success) {
                        return [2 /*return*/, rescheduleResult];
                    }
                    if (!(data.address || data.phone)) return [3 /*break*/, 8];
                    return [4 /*yield*/, updateCustomerAddressInDb(orders, data)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: return [2 /*return*/, {
                        success: true,
                        message: "NDR request processed successfully"
                    }];
                case 9:
                    error_5 = _a.sent();
                    return [2 /*return*/, handleApiError(error_5, "createEkartNdr")];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function updateCustomerDetails(orders, data, token) {
    return __awaiter(this, void 0, void 0, function () {
        var updateRequestType, updateRequestDetails, requestBody, response, error_6;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    updateRequestType = "";
                    updateRequestDetails = {};
                    if (data.phone && !data.address) {
                        updateRequestType = "CUSTOMER_CONTACT";
                        updateRequestDetails = {
                            customer_address: {
                                primary_contact_number: data.phone
                            }
                        };
                    }
                    else {
                        updateRequestType = "CUSTOMER_DETAILS";
                        updateRequestDetails = {
                            customer_address: {
                                address_line1: data.address || "",
                                city: ((_a = orders === null || orders === void 0 ? void 0 : orders.customerAddress) === null || _a === void 0 ? void 0 : _a.city) || "",
                                state: ((_b = orders === null || orders === void 0 ? void 0 : orders.customerAddress) === null || _b === void 0 ? void 0 : _b.state) || "",
                                pincode: ((_c = orders === null || orders === void 0 ? void 0 : orders.customerAddress) === null || _c === void 0 ? void 0 : _c.pincode) || "",
                                primary_contact_number: data.phone || ((_d = orders === null || orders === void 0 ? void 0 : orders.customerAddress) === null || _d === void 0 ? void 0 : _d.contactNumber) || ""
                            }
                        };
                    }
                    requestBody = {
                        update_request_type: updateRequestType,
                        update_request_details: updateRequestDetails,
                        tracking_id: orders.awbNumber
                    };
                    console.log("Request body for Ekart customer details update:", requestBody);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.put("https://api.ekartlogistics.com/v2/shipments/update_shipment", requestBody, {
                            headers: getEkartHeaders(token),
                        })];
                case 2:
                    response = _e.sent();
                    console.log("Response from Ekart (customer details update):", JSON.stringify(response.data));
                    return [2 /*return*/, parseEkartResponse(response.data, updateRequestType)];
                case 3:
                    error_6 = _e.sent();
                    return [2 /*return*/, handleApiError(error_6, "updateCustomerDetails")];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function rescheduleDelivery(awbNumber, token) {
    return __awaiter(this, void 0, void 0, function () {
        var tomorrow, formattedDate, updateRequestDetails, requestBody, response, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    formattedDate = tomorrow.toISOString().split('T')[0];
                    updateRequestDetails = {
                        updated_delivery_date: formattedDate
                    };
                    requestBody = {
                        update_request_type: "RESCHEDULE_DELIVERY_DATE",
                        update_request_details: updateRequestDetails,
                        tracking_id: awbNumber
                    };
                    console.log("Request body for Ekart delivery reschedule:", requestBody);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.put("https://api.ekartlogistics.com/v2/shipments/update_shipment", requestBody, {
                            headers: getEkartHeaders(token),
                        })];
                case 2:
                    response = _a.sent();
                    console.log("Response from Ekart (reschedule delivery):", JSON.stringify(response.data));
                    console.log("NDR Response from Ekart reattempt:", response.data);
                    return [2 /*return*/, parseEkartResponse(response.data, "RESCHEDULE_DELIVERY_DATE")];
                case 3:
                    error_7 = _a.sent();
                    return [2 /*return*/, handleApiError(error_7, "rescheduleDelivery")];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function updateCustomerAddressInDb(orders, data) {
    return __awaiter(this, void 0, void 0, function () {
        var customerId, dbError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    customerId = orders.forwardCustomerId || orders.reverseCustomerId;
                    if (!customerId) {
                        console.log("No valid customer ID found for address update");
                        return [2 /*return*/];
                    }
                    console.log("Updating ".concat(orders.forwardCustomerId ? "forward" : "reverse", " customer address"));
                    return [4 /*yield*/, prisma_1.default.customerAddress.update({
                            where: {
                                customerId: customerId,
                            },
                            data: {
                                address: data.address || undefined,
                                contactNumber: data.phone || undefined,
                            },
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    dbError_1 = _a.sent();
                    console.error("Error updating customer address:", dbError_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getEkartHeaders(token) {
    return {
        Authorization: "".concat(token),
        HTTP_X_MERCHANT_CODE: "SHY",
    };
}
function parseEkartResponse(responseData, requestType) {
    var _a, _b;
    // Check for success conditions
    if ((((_b = (_a = responseData === null || responseData === void 0 ? void 0 : responseData.response) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.status_code) === 200) ||
        ((responseData === null || responseData === void 0 ? void 0 : responseData.success) === true) ||
        ((responseData === null || responseData === void 0 ? void 0 : responseData.status) === "SUCCESS")) {
        return {
            success: true,
            message: "Operation successful for ".concat(requestType)
        };
    }
    // Check for specific error responses in array format
    if (Array.isArray(responseData === null || responseData === void 0 ? void 0 : responseData.response)) {
        var failedRequests = responseData.response.filter(function (item) {
            return item.status === "REQUEST_REJECTED" || item.status === "FAILED";
        });
        if (failedRequests.length > 0) {
            var errorItem = failedRequests[0];
            var errorMessages = Array.isArray(errorItem.message)
                ? errorItem.message.join(", ")
                : errorItem.message || "Request rejected";
            return {
                success: false,
                error: "".concat(errorItem.status, ": ").concat(errorMessages)
            };
        }
    }
    // Default error response
    return {
        success: false,
        error: (responseData === null || responseData === void 0 ? void 0 : responseData.message) || (responseData === null || responseData === void 0 ? void 0 : responseData.error) || "Failed to process ".concat(requestType, " request")
    };
}
function handleApiError(error, source) {
    if (axios_1.default.isAxiosError(error) && error.response) {
        console.error("Error in ".concat(source, ":"), {
            status: error.response.status,
            statusText: error.response.statusText,
            data: JSON.stringify(error.response.data)
        });
        // Try to parse the error response if it's a string
        var errorData = void 0;
        if (typeof error.response.data === 'string') {
            try {
                errorData = JSON.parse(error.response.data);
            }
            catch (e) {
                errorData = { message: error.response.data };
            }
        }
        else {
            errorData = error.response.data;
        }
        // Extract error message from the response array structure
        if (Array.isArray(errorData === null || errorData === void 0 ? void 0 : errorData.response)) {
            var failedItem = errorData.response.find(function (item) {
                return item.status === "REQUEST_REJECTED" || item.status === "FAILED";
            });
            if (failedItem) {
                var errorMessages = Array.isArray(failedItem.message)
                    ? failedItem.message.join(", ")
                    : failedItem.message || "Request rejected";
                return {
                    success: false,
                    error: "".concat(failedItem.status, ": ").concat(errorMessages)
                };
            }
        }
        var errorMessage = (errorData === null || errorData === void 0 ? void 0 : errorData.message) ||
            (errorData === null || errorData === void 0 ? void 0 : errorData.error) ||
            (errorData === null || errorData === void 0 ? void 0 : errorData.details) ||
            "Error from Ekart API";
        return {
            success: false,
            error: "Ekart API error: ".concat(errorMessage, " (").concat(error.response.status, ")")
        };
    }
    if (error instanceof Error) {
        console.error("Error in ".concat(source, ":"), error);
        return { success: false, error: error.message };
    }
    console.error("Unexpected error in ".concat(source, ":"), error);
    return {
        success: false,
        error: "An unexpected error occurred in ".concat(source)
    };
}
function createEkartRto(order, data) {
    return __awaiter(this, void 0, void 0, function () {
        var token, requestBody, response, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ekart")];
                case 1:
                    token = _a.sent();
                    console.log("inside createEkartRto ", token);
                    requestBody = {
                        request_details: [
                            {
                                tracking_id: order.awbNumber,
                            },
                        ],
                    };
                    console.log("Request Body for ekart rto:", requestBody);
                    return [4 /*yield*/, axios_1.default.put("https://api.ekartlogistics.com/v2/shipments/rto/create", requestBody, {
                            headers: {
                                Authorization: "".concat(token),
                                "Content-Type": "application/json",
                                HTTP_X_MERCHANT_CODE: "SHY",
                            },
                        })];
                case 2:
                    response = _a.sent();
                    console.log(JSON.stringify("Order cancellation response:", response.data));
                    if ((response.data.reason = response.data.response[0].status_code === 200)) {
                        return [2 /*return*/, { success: true, message: "Order was successfully canceled" }];
                    }
                    return [2 /*return*/, { success: false, message: "Order cancellation failed" }];
                case 3:
                    error_8 = _a.sent();
                    console.error(JSON.stringify({
                        message: "Error cancelling Ekart order:",
                        errorDetails: error_8,
                        path: "deliverypartner/ekart",
                    }));
                    if (error_8.response && error_8.response.data) {
                        console.error(JSON.stringify({
                            message: "Error response data:",
                            errorDetails: error_8.response.data,
                            path: "deliverypartner/ekart",
                        }));
                    }
                    console.error("Failed to RTO Ekart order");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
