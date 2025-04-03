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
exports.createXpressbeesOrder = createXpressbeesOrder;
exports.cancelXpressbeesOrder = cancelXpressbeesOrder;
exports.createXpressbeesNdr = createXpressbeesNdr;
var axios_1 = require("axios");
var client_1 = require("@prisma/client");
// import { revalidatePath } from "next/cache";
// import { getDeliveryPartnerId } from "../orders";
var tokenManager_1 = require("./tokenManager");
var prisma_1 = require("../../lib/prisma");
function createXpressbeesOrder(orderId, id) {
    return __awaiter(this, void 0, void 0, function () {
        var token, reference_id, order_1, warehouseAddress, rtoWarehouseAddress, customerAddress, collectableAmount, requestBody, response_1, result, safeToNumber, axiosError_1, errorMessage, error_1;
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 12, , 13]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("xpressbees")];
                case 1:
                    token = _h.sent();
                    reference_id = orderId + Math.floor(Math.random() * 1000).toString();
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
                    order_1 = _h.sent();
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
                    warehouseAddress = _h.sent();
                    return [4 /*yield*/, prisma_1.default.address.findUnique({
                            where: { id: (_a = order_1.rtoAgentAddressId) !== null && _a !== void 0 ? _a : undefined },
                        })];
                case 4:
                    rtoWarehouseAddress = _h.sent();
                    if (!warehouseAddress || !rtoWarehouseAddress) {
                        console.error("Warehouse address or RTO warehouse address not found");
                        return [2 /*return*/, {
                                success: false,
                                error: "Warehouse address or RTO warehouse address not found",
                            }];
                    }
                    customerAddress = order_1.customerAddress;
                    if (!customerAddress) {
                        console.error("Customer address not found");
                        return [2 /*return*/, { success: false, error: "Customer address not found" }];
                    }
                    collectableAmount = ((_b = order_1.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "prepaid"
                        ? 0
                        : order_1.totalOrderValue;
                    requestBody = {
                        order_number: reference_id,
                        payment_type: (_c = order_1.paymentMode) === null || _c === void 0 ? void 0 : _c.toLowerCase(),
                        order_amount: order_1.totalOrderValue,
                        package_weight: order_1.applicableWeight
                            ? Math.round(order_1.applicableWeight.toNumber())
                            : 0,
                        package_length: (_d = order_1.length) === null || _d === void 0 ? void 0 : _d.toString(),
                        package_breadth: (_e = order_1.breadth) === null || _e === void 0 ? void 0 : _e.toString(),
                        package_height: (_f = order_1.height) === null || _f === void 0 ? void 0 : _f.toString(),
                        consignee: {
                            name: customerAddress.fullName,
                            address: customerAddress.address,
                            address_2: customerAddress.landmark || "",
                            city: customerAddress.city,
                            state: customerAddress.state,
                            pincode: customerAddress.pincode,
                            phone: customerAddress.contactNumber,
                        },
                        pickup: {
                            warehouse_name: warehouseAddress.tag,
                            name: ((_g = order_1 === null || order_1 === void 0 ? void 0 : order_1.Users) === null || _g === void 0 ? void 0 : _g.StoreName) || warehouseAddress.tag,
                            address: warehouseAddress.address,
                            address_2: warehouseAddress.landmark == " " ? "null" : warehouseAddress.landmark,
                            city: warehouseAddress.city,
                            state: warehouseAddress.state,
                            pincode: warehouseAddress.pincode.toString(),
                            phone: warehouseAddress.contactNumber,
                        },
                        order_items: order_1.Packages.map(function (item) { return ({
                            name: item.productName,
                            qty: item.quantity,
                            price: parseFloat(item.price),
                        }); }),
                        courier_id: id,
                        collectable_amount: collectableAmount,
                    };
                    _h.label = 5;
                case 5:
                    _h.trys.push([5, 10, , 11]);
                    return [4 /*yield*/, axios_1.default.post("https://shipment.xpressbees.com/api/shipments2", requestBody, {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                                "Content-Type": "application/json",
                            },
                        })];
                case 6:
                    response_1 = _h.sent();
                    console.log(JSON.stringify(requestBody), "requestBody for xpressbees");
                    if (!(response_1.status === 200 && response_1.data.data.awb_number)) return [3 /*break*/, 8];
                    return [4 /*yield*/, prisma_1.default.$transaction(function (prismaTransaction) { return __awaiter(_this, void 0, void 0, function () {
                            var updatedOrder;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prismaTransaction.orders.update({
                                            where: { id: order_1.id },
                                            data: {
                                                status: client_1.OrderStatus.READY_TO_SHIP,
                                                awbNumber: response_1.data.data.awb_number,
                                                shippingDate: new Date(),
                                            },
                                        })];
                                    case 1:
                                        updatedOrder = _a.sent();
                                        return [2 /*return*/, updatedOrder];
                                }
                            });
                        }); })];
                case 7:
                    result = _h.sent();
                    safeToNumber = function (value) {
                        return value ? value.toNumber() : null;
                    };
                    return [2 /*return*/, {
                            success: true,
                            order: __assign(__assign({}, result), { deadWeight: safeToNumber(result.deadWeight), breadth: safeToNumber(result.breadth), height: safeToNumber(result.height), length: safeToNumber(result.length), applicableWeight: safeToNumber(result.applicableWeight), totalOrderValue: safeToNumber(result.totalOrderValue) }),
                            awbNumber: response_1.data.data.awb_number,
                        }];
                case 8:
                    JSON.stringify({
                        data: "Failed to create order with Xpressbees",
                        error: response_1.data.data,
                        path: "deliveryPartner/xpressbees",
                    });
                    _h.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    axiosError_1 = _h.sent();
                    if (axiosError_1.response) {
                        errorMessage = axiosError_1.response.data.message || "Pincode not serviceable";
                        return [2 /*return*/, {
                                success: false,
                                error: errorMessage,
                            }];
                    }
                    else if (axiosError_1.request) {
                        return [2 /*return*/, {
                                success: false,
                                error: "No response received from Xpressbees",
                            }];
                    }
                    else {
                        return [2 /*return*/, {
                                success: false,
                                error: axiosError_1.message,
                            }];
                    }
                    return [3 /*break*/, 11];
                case 11: return [3 /*break*/, 13];
                case 12:
                    error_1 = _h.sent();
                    JSON.stringify({
                        data: "Error in createXpressbeesOrder:",
                        errorDetails: error_1,
                        path: "deliveryPartner/xpressbees",
                    });
                    return [2 /*return*/, {
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : "An unknown error occurred",
                        }];
                case 13: return [2 /*return*/];
            }
        });
    });
}
function cancelXpressbeesOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var token, response, error_2;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    _k.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("xpressbees")];
                case 1:
                    token = _k.sent();
                    return [4 /*yield*/, axios_1.default.post("https://shipment.xpressbees.com/api/shipments2/cancel", {
                            awb: awbNumber,
                        }, {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                                "Content-Type": "application/json",
                            },
                        })];
                case 2:
                    response = _k.sent();
                    // Handle specific success conditions
                    if (response.data.status === true ||
                        (response.data.status === false &&
                            (response.data.message === "Unable to cancel" ||
                                response.data.message === "Unable to cancel order"))) {
                        console.log(JSON.stringify({
                            data: "Xpressbees order cancellation handled successfully:",
                            responseDetails: response.data,
                            path: "deliveryPartner/xpressbees",
                        }));
                        return [2 /*return*/, { success: true, message: response.data.message }];
                    }
                    else {
                        console.error(JSON.stringify({
                            data: "Failed to cancel Xpressbees order:",
                            errorDetails: response.data,
                            path: "deliveryPartner/xpressbees",
                        }));
                        return [2 /*return*/, {
                                success: false,
                                message: response.data.message || "Unable to cancel order",
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _k.sent();
                    if (axios_1.default.isAxiosError(error_2)) {
                        // Handle 404 with specific response body
                        if (((_a = error_2.response) === null || _a === void 0 ? void 0 : _a.status) === 404 &&
                            ((_c = (_b = error_2.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.status) === false &&
                            ((_e = (_d = error_2.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) === "Unable to cancel") {
                            console.log(JSON.stringify({
                                data: "Xpressbees order cancellation handled successfully (404 case):",
                                responseDetails: (_f = error_2.response) === null || _f === void 0 ? void 0 : _f.data,
                                path: "deliveryPartner/xpressbees",
                            }));
                            return [2 /*return*/, {
                                    success: true,
                                    message: ((_h = (_g = error_2.response) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.message) || "Order cancellation processed",
                                }];
                        }
                        // Log other Axios errors
                        console.error(JSON.stringify({
                            errorDetails: ((_j = error_2.response) === null || _j === void 0 ? void 0 : _j.data) || error_2.message,
                            path: "deliveryPartner/xpressbees",
                        }));
                        return [2 /*return*/, {
                                success: false,
                                message: "An error occurred while cancelling the order",
                            }];
                    }
                    else {
                        // Log unexpected errors
                        console.error(JSON.stringify({
                            errorDetails: error_2,
                            path: "deliveryPartner/xpressbees",
                        }));
                        return [2 /*return*/, {
                                success: false,
                                message: "An unexpected error occurred while cancelling the order",
                            }];
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createXpressbeesNdr(order, data) {
    return __awaiter(this, void 0, void 0, function () {
        var token, orders, actionType, actionData, tomorrow, formattedDate, isReAttemptOnly, requestBody, response, result, customerId, dbError_1, apiError_1, result, errorMessage, error_3, result;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log("Starting createXpressbeesNdr for orderId:", order.orderId);
                    console.log("Data:", data);
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 17, , 18]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("xpressbees")];
                case 2:
                    token = _f.sent();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { orderId: Number(order.orderId) },
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
                case 3:
                    orders = _f.sent();
                    if (!orders) {
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    if (!orders.awbNumber) {
                        return [2 /*return*/, { success: false, error: "AWB number is missing" }];
                    }
                    actionType = "re-attempt";
                    actionData = {};
                    tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    formattedDate = tomorrow.toISOString().split('T')[0];
                    actionData.re_attempt_date = formattedDate;
                    isReAttemptOnly = JSON.stringify(data) === "{}";
                    if (!isReAttemptOnly) {
                        if ((data === null || data === void 0 ? void 0 : data.address) && (data === null || data === void 0 ? void 0 : data.phone)) {
                            actionType = "change_address";
                            actionData.name = (_a = orders.customerAddress) === null || _a === void 0 ? void 0 : _a.fullName;
                            actionData.address_1 = data.address;
                            actionData.phone = data.phone;
                            delete actionData.re_attempt_date;
                        }
                        else if (data === null || data === void 0 ? void 0 : data.address) {
                            actionType = "change_address";
                            actionData.name = (_b = orders.customerAddress) === null || _b === void 0 ? void 0 : _b.fullName;
                            actionData.address_1 = data.address;
                            delete actionData.re_attempt_date;
                        }
                        else if (data === null || data === void 0 ? void 0 : data.phone) {
                            actionType = "change_phone";
                            actionData.phone = data.phone;
                            delete actionData.re_attempt_date;
                        }
                    }
                    requestBody = [
                        {
                            awb: orders.awbNumber,
                            action: actionType,
                            action_data: actionData
                        }
                    ];
                    console.log("XpressBees NDR request body:", JSON.stringify(requestBody));
                    _f.label = 4;
                case 4:
                    _f.trys.push([4, 15, , 16]);
                    return [4 /*yield*/, axios_1.default.post("https://shipment.xpressbees.com/api/ndr/create", requestBody, {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(token)
                            }
                        })];
                case 5:
                    response = _f.sent();
                    console.log("XpressBees NDR Response:", response.data);
                    if (!(Array.isArray(response.data) && response.data.length > 0)) return [3 /*break*/, 13];
                    result = response.data[0];
                    if (!(result.status === true)) return [3 /*break*/, 11];
                    if (!((actionType === "change_address" || actionType === "change_phone") &&
                        (data.address || data.phone))) return [3 /*break*/, 10];
                    _f.label = 6;
                case 6:
                    _f.trys.push([6, 9, , 10]);
                    customerId = orders.forwardCustomerId || orders.reverseCustomerId;
                    if (!customerId) return [3 /*break*/, 8];
                    return [4 /*yield*/, prisma_1.default.customerAddress.update({
                            where: {
                                customerId: customerId
                            },
                            data: {
                                address: data.address || undefined,
                                contactNumber: data.phone || undefined
                            }
                        })];
                case 7:
                    _f.sent();
                    console.log("Customer address updated successfully");
                    _f.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    dbError_1 = _f.sent();
                    console.error("Error updating customer address:", dbError_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, {
                        success: true,
                        message: "XpressBees NDR ".concat(actionType, " created successfully"),
                        data: result
                    }];
                case 11: return [2 /*return*/, {
                        success: false,
                        error: result.message || "Failed to create XpressBees NDR"
                    }];
                case 12: return [3 /*break*/, 14];
                case 13: return [2 /*return*/, {
                        success: false,
                        error: "Invalid response format from XpressBees API"
                    }];
                case 14: return [3 /*break*/, 16];
                case 15:
                    apiError_1 = _f.sent();
                    if (axios_1.default.isAxiosError(apiError_1) && apiError_1.response) {
                        console.error("XpressBees API Error:", {
                            status: apiError_1.response.status,
                            statusText: apiError_1.response.statusText,
                            data: apiError_1.response.data
                        });
                        if (Array.isArray(apiError_1.response.data) && apiError_1.response.data.length > 0) {
                            result = apiError_1.response.data[0];
                            return [2 /*return*/, {
                                    success: false,
                                    error: result.message || "XpressBees API error"
                                }];
                        }
                        errorMessage = ((_c = apiError_1.response.data) === null || _c === void 0 ? void 0 : _c.message) ||
                            ((_d = apiError_1.response.data) === null || _d === void 0 ? void 0 : _d.error) ||
                            "Error from XpressBees API";
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    }
                    if (apiError_1 instanceof Error) {
                        return [2 /*return*/, { success: false, error: apiError_1.message }];
                    }
                    return [2 /*return*/, { success: false, error: "Unknown error occurred while creating XpressBees NDR" }];
                case 16: return [3 /*break*/, 18];
                case 17:
                    error_3 = _f.sent();
                    console.error("Error in createXpressbeesNdr:", error_3);
                    if (axios_1.default.isAxiosError(error_3) && error_3.response) {
                        if (Array.isArray(error_3.response.data) && error_3.response.data.length > 0) {
                            result = error_3.response.data[0];
                            return [2 /*return*/, {
                                    success: false,
                                    error: result.message || "XpressBees API error"
                                }];
                        }
                        return [2 /*return*/, {
                                success: false,
                                error: ((_e = error_3.response.data) === null || _e === void 0 ? void 0 : _e.message) || 'Unknown API error'
                            }];
                    }
                    if (error_3 instanceof Error) {
                        return [2 /*return*/, { success: false, error: error_3.message }];
                    }
                    return [2 /*return*/, {
                            success: false,
                            error: "An unexpected error occurred while creating XpressBees NDR request"
                        }];
                case 18: return [2 /*return*/];
            }
        });
    });
}
