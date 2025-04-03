"use server";
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
exports.createSmartshipOrder = createSmartshipOrder;
exports.cancelSmartship = cancelSmartship;
exports.createSmartshipNdr = createSmartshipNdr;
var axios_1 = require("axios");
var tokenManager_1 = require("./tokenManager");
var prisma_1 = require("../../lib/prisma");
var client_1 = require("@prisma/client");
function registerSmartshipHub(order, warehouseAddress, token, shypmentType) {
    return __awaiter(this, void 0, void 0, function () {
        var phoneNumber, deliveryTypeId, requestBody, hubDetails, hub, hubId, error_1;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 3, , 4]);
                    // Validate required fields
                    if (!warehouseAddress) {
                        return [2 /*return*/, { success: false, error: "Warehouse address is required" }];
                    }
                    phoneNumber = (_a = warehouseAddress.contactNumber) === null || _a === void 0 ? void 0 : _a.replace(/\D/g, "");
                    if (!phoneNumber || phoneNumber.length !== 10) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Invalid phone number. Please provide a 10-digit phone number.",
                            }];
                    }
                    deliveryTypeId = void 0;
                    if (order.applicableWeight) {
                        if (Number(order.applicableWeight) > 5) {
                            deliveryTypeId = 3;
                        }
                        else {
                            if (shypmentType === "air") {
                                deliveryTypeId = 1;
                            }
                            else {
                                deliveryTypeId = 2;
                            }
                        }
                    }
                    requestBody = {
                        hub_details: {
                            hub_name: ((_b = order.Users) === null || _b === void 0 ? void 0 : _b.StoreName) || warehouseAddress.tag || "",
                            pincode: warehouseAddress.pincode || "",
                            city: warehouseAddress.city || "",
                            state: warehouseAddress.state || "",
                            address1: warehouseAddress.address || "",
                            hub_phone: phoneNumber,
                            delivery_type_id: deliveryTypeId,
                        },
                    };
                    console.log(shypmentType, "requestBody", requestBody.hub_details.delivery_type_id);
                    return [4 /*yield*/, fetch("https://api.smartship.in/v2/app/Fulfillmentservice/hubRegistration", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: token,
                            },
                            body: JSON.stringify(requestBody),
                        })];
                case 1:
                    hubDetails = _h.sent();
                    if (!hubDetails.ok) {
                        console.error("API request failed with status ".concat(hubDetails.status));
                        return [2 /*return*/, {
                                success: false,
                                error: "Hub registration failed",
                            }];
                    }
                    return [4 /*yield*/, hubDetails.json()];
                case 2:
                    hub = _h.sent();
                    // Handle validation errors
                    if ((_d = (_c = hub.data) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.validation_error) {
                        return [2 /*return*/, {
                                success: false,
                                error: Array.isArray(hub.data.message.validation_error)
                                    ? hub.data.message.validation_error.join(", ")
                                    : hub.data.message.info || "Validation error occurred",
                            }];
                    }
                    hubId = hub.message === "OK"
                        ? (_f = (_e = hub.data) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.registered_hub_id
                        : (_g = hub.data) === null || _g === void 0 ? void 0 : _g.hub_id;
                    if (!hubId) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Failed to get hub ID from response",
                            }];
                    }
                    return [2 /*return*/, {
                            success: true,
                            hubId: hubId,
                        }];
                case 3:
                    error_1 = _h.sent();
                    console.error(JSON.stringify({
                        errorDetails: error_1,
                        path: "deliveryPartner/smartship/hubRegistration",
                    }));
                    return [2 /*return*/, {
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : "An unknown error occurred",
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createSmartshipOrder(orderId, shypmentType) {
    return __awaiter(this, void 0, void 0, function () {
        var token, reference_id, order, warehouseAddress, hubResult, hubId, collectableAmount, requestBody, createOrder, data, orderDetails, error_2;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0: return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("smartship")];
                case 1:
                    token = _m.sent();
                    reference_id = orderId + Math.floor(Math.random() * 1000).toString();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { id: orderId },
                            include: {
                                PickUpAddress: true,
                                customerAddress: true,
                                Packages: true,
                                Users: { select: { StoreName: true } },
                            },
                        })];
                case 2:
                    order = _m.sent();
                    if (!(order === null || order === void 0 ? void 0 : order.agentAddressId)) {
                        return [2 /*return*/, { success: false, error: "Agent address not found" }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findUnique({
                            where: { id: order.agentAddressId },
                        })];
                case 3:
                    warehouseAddress = _m.sent();
                    _m.label = 4;
                case 4:
                    _m.trys.push([4, 9, , 10]);
                    return [4 /*yield*/, registerSmartshipHub(order, warehouseAddress, token, shypmentType)];
                case 5:
                    hubResult = _m.sent();
                    if (!hubResult.success) {
                        return [2 /*return*/, { success: false, error: hubResult.error }];
                    }
                    hubId = hubResult.hubId;
                    collectableAmount = ((_a = order.paymentMode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "prepaid"
                        ? 0
                        : order.totalOrderValue;
                    requestBody = {
                        request_info: {
                            client_id: "7W1XHVLE2R75AVYI3IBS7C5KO9SV7M",
                            run_type: "create",
                            shipment_type: 1,
                        },
                        orders: [
                            {
                                client_order_reference_id: reference_id,
                                order_collectable_amount: collectableAmount,
                                total_order_value: order.totalOrderValue,
                                payment_type: order.paymentMode,
                                package_order_weight: (Number(order.applicableWeight) * 1000).toString(),
                                package_order_length: order.length,
                                package_order_height: order.height,
                                package_order_width: order.breadth,
                                shipper_hub_id: hubId,
                                order_invoice_number: "INV001",
                                order_invoice_date: new Date(),
                                order_meta: {
                                    preferred_carriers: [shypmentType === "surface" ? 279 : 282],
                                },
                                product_details: order.Packages.map(function (item) { return ({
                                    client_product_reference_id: item.PackageId.toString(),
                                    product_name: item.productName,
                                    product_category: item.category,
                                    product_quantity: item.quantity,
                                    product_invoice_value: item.price,
                                    product_gst_tax_rate: 18,
                                }); }),
                                consignee_details: {
                                    consignee_name: (_b = order.customerAddress) === null || _b === void 0 ? void 0 : _b.fullName,
                                    consignee_phone: (_c = order.customerAddress) === null || _c === void 0 ? void 0 : _c.contactNumber,
                                    consignee_email: (_d = order.customerAddress) === null || _d === void 0 ? void 0 : _d.email,
                                    consignee_complete_address: (_e = order.customerAddress) === null || _e === void 0 ? void 0 : _e.address,
                                    consignee_pincode: (_f = order.customerAddress) === null || _f === void 0 ? void 0 : _f.pincode,
                                },
                            },
                        ],
                    };
                    console.log(hubId, "shypmentType");
                    return [4 /*yield*/, fetch("https://api.smartship.in/v2/app/Fulfillmentservice/orderRegistrationOneStep", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: token,
                            },
                            body: JSON.stringify(requestBody),
                        })];
                case 6:
                    createOrder = _m.sent();
                    console.log(requestBody, "requestBody for smartship");
                    if (!createOrder.ok) {
                        return [2 /*return*/, { success: false, error: "Failed to create order" }];
                    }
                    return [4 /*yield*/, createOrder.json()];
                case 7:
                    data = _m.sent();
                    // Log error details if present
                    if ((_h = (_g = data.data) === null || _g === void 0 ? void 0 : _g.errors) === null || _h === void 0 ? void 0 : _h.data_discrepancy) {
                        console.error(JSON.stringify({
                            errorDetails: data.data.errors.data_discrepancy,
                            path: "deliveryPartner/smartship",
                        }));
                        return [2 /*return*/, {
                                success: false,
                                error: (_j = data.data.errors.data_discrepancy[0]) === null || _j === void 0 ? void 0 : _j.error[0],
                            }];
                    }
                    orderDetails = (_l = (_k = data === null || data === void 0 ? void 0 : data.data) === null || _k === void 0 ? void 0 : _k.success_order_details) === null || _l === void 0 ? void 0 : _l.orders[0];
                    console.log(" line 158 of smartship", orderDetails);
                    if ((orderDetails === null || orderDetails === void 0 ? void 0 : orderDetails.carrier_name) == "NSS") {
                        return [2 /*return*/, {
                                success: false,
                                error: "Pincode not serviceable",
                                message: "The delivery location is not serviceable",
                            }];
                    }
                    // Handle AWB number false case
                    if ((orderDetails === null || orderDetails === void 0 ? void 0 : orderDetails.awb_number) === false) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Pincode not serviceable",
                                message: "The delivery location is not serviceable",
                            }];
                    }
                    // Update order with AWB number
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { id: orderId },
                            data: {
                                status: client_1.OrderStatus.READY_TO_SHIP,
                                awbNumber: orderDetails.awb_number,
                                responseOrderId: reference_id,
                                SS_Delivery_Code: orderDetails.route_code,
                                shippingDate: new Date(),
                            },
                        })];
                case 8:
                    // Update order with AWB number
                    _m.sent();
                    return [2 /*return*/, {
                            success: true,
                            awbNumber: orderDetails.awb_number,
                        }];
                case 9:
                    error_2 = _m.sent();
                    console.error(JSON.stringify({
                        errorDetails: error_2,
                        path: "deliveryPartner/smartship",
                    }));
                    return [2 /*return*/, {
                            success: false,
                            error: error_2 instanceof Error ? error_2.message : "An unknown error occurred",
                        }];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function cancelSmartship(responseId, awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var token, response, data;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("smartship")];
                case 1:
                    token = _b.sent();
                    return [4 /*yield*/, fetch("https://api.smartship.in/v2/app/Fulfillmentservice/orderCancellation", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: token,
                            },
                            body: JSON.stringify({
                                orders: {
                                    client_order_reference_ids: {
                                        responseId: responseId,
                                    },
                                },
                            }),
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _b.sent();
                    // console.log(data, " line 233 of cancel smartship");
                    console.error(JSON.stringify({
                        errorDetails: (_a = data.data.order_cancellation_details) === null || _a === void 0 ? void 0 : _a.successful,
                        path: "deliveryPartner/smartship",
                    }));
                    return [2 /*return*/, { success: true, message: "Order cancelled successfully" }];
                case 4: return [2 /*return*/, { success: false, message: "Order cancellation unsuccessfully" }];
            }
        });
    });
}
function createSmartshipNdr(order, data, action) {
    return __awaiter(this, void 0, void 0, function () {
        var token, orders, tomorrow, formattedDate, nextAttemptDate, requestBody, response, customerId, dbError_1, errorData, apiError_1, errorDetail, errorMessage, error_3, errorDetail;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        return __generator(this, function (_q) {
            switch (_q.label) {
                case 0:
                    console.log("Starting createSmartshipNdr for orderId:", order.orderId);
                    console.log("Data:", data);
                    _q.label = 1;
                case 1:
                    _q.trys.push([1, 15, , 16]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("smartship")];
                case 2:
                    token = _q.sent();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { orderId: Number(order.orderId) },
                            include: {
                                customerAddress: true,
                            },
                        })];
                case 3:
                    orders = _q.sent();
                    if (!orders) {
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    formattedDate = tomorrow.toISOString().split('T')[0];
                    nextAttemptDate = formattedDate;
                    requestBody = {
                        orders: [
                            {
                                client_order_reference_id: [orders.responseOrderId],
                                action_id: action == "ndr" ? "1" : "2",
                                comments: action == "ndr" ? "Reattempt requested" : "RTO Requested",
                                next_attempt_date: action == "ndr" ? nextAttemptDate : "",
                                address: (data === null || data === void 0 ? void 0 : data.address) || ((_a = orders.customerAddress) === null || _a === void 0 ? void 0 : _a.address) || "",
                                phone: (data === null || data === void 0 ? void 0 : data.phone) || ((_b = orders.customerAddress) === null || _b === void 0 ? void 0 : _b.contactNumber) || "",
                                names: ((_c = orders.customerAddress) === null || _c === void 0 ? void 0 : _c.fullName) || "",
                                alternate_address: ((_d = orders.customerAddress) === null || _d === void 0 ? void 0 : _d.address) || "",
                                alternate_number: ((_e = orders.customerAddress) === null || _e === void 0 ? void 0 : _e.contactNumber) || ""
                            }
                        ]
                    };
                    console.log("Smartship NDR request body:", JSON.stringify(requestBody));
                    _q.label = 4;
                case 4:
                    _q.trys.push([4, 13, , 14]);
                    return [4 /*yield*/, axios_1.default.post("http://api.smartship.in/v2/app/Fulfillmentservice/orderReattempt", requestBody, {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(token)
                            }
                        })];
                case 5:
                    response = _q.sent();
                    console.log("Smartship NDR Response:", JSON.stringify(response.data));
                    if (!(response.data && response.data.status === 1 && response.data.code === 200)) return [3 /*break*/, 12];
                    if (!(response.data.data &&
                        response.data.data.success_orders &&
                        response.data.data.success_orders.length > 0)) return [3 /*break*/, 11];
                    if (!(data.address || data.phone)) return [3 /*break*/, 10];
                    _q.label = 6;
                case 6:
                    _q.trys.push([6, 9, , 10]);
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
                    _q.sent();
                    console.log("Customer address updated successfully");
                    _q.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    dbError_1 = _q.sent();
                    console.error("Error updating customer address:", dbError_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, {
                        success: true,
                        message: "Smartship NDR reattempt created successfully",
                        data: response.data.data.success_orders[0]
                    }];
                case 11:
                    if (response.data.data &&
                        response.data.data.errors &&
                        response.data.data.errors.length > 0) {
                        errorData = response.data.data.errors[0];
                        return [2 /*return*/, {
                                success: false,
                                error: errorData.error || "Failed to create Smartship NDR"
                            }];
                    }
                    _q.label = 12;
                case 12: return [2 /*return*/, {
                        success: false,
                        error: ((_f = response.data) === null || _f === void 0 ? void 0 : _f.message) || "Invalid response format from Smartship API"
                    }];
                case 13:
                    apiError_1 = _q.sent();
                    if (axios_1.default.isAxiosError(apiError_1) && apiError_1.response) {
                        console.error("Smartship API Error:", {
                            status: apiError_1.response.status,
                            statusText: apiError_1.response.statusText,
                            data: apiError_1.response.data
                        });
                        if (((_h = (_g = apiError_1.response.data) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.errors) &&
                            apiError_1.response.data.data.errors.length > 0) {
                            errorDetail = apiError_1.response.data.data.errors[0];
                            return [2 /*return*/, {
                                    success: false,
                                    error: errorDetail.error || "API error"
                                }];
                        }
                        errorMessage = ((_j = apiError_1.response.data) === null || _j === void 0 ? void 0 : _j.message) ||
                            ((_k = apiError_1.response.data) === null || _k === void 0 ? void 0 : _k.error) ||
                            "Error from Smartship API";
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    }
                    if (apiError_1 instanceof Error) {
                        return [2 /*return*/, { success: false, error: apiError_1.message }];
                    }
                    return [2 /*return*/, { success: false, error: "Unknown error occurred while creating Smartship NDR" }];
                case 14: return [3 /*break*/, 16];
                case 15:
                    error_3 = _q.sent();
                    console.error("Error in createSmartshipNdr:", error_3);
                    if (axios_1.default.isAxiosError(error_3) && error_3.response) {
                        if (((_m = (_l = error_3.response.data) === null || _l === void 0 ? void 0 : _l.data) === null || _m === void 0 ? void 0 : _m.errors) &&
                            error_3.response.data.data.errors.length > 0) {
                            errorDetail = error_3.response.data.data.errors[0];
                            return [2 /*return*/, {
                                    success: false,
                                    error: errorDetail.error || ((_o = error_3.response.data) === null || _o === void 0 ? void 0 : _o.message) || 'API error'
                                }];
                        }
                        return [2 /*return*/, {
                                success: false,
                                error: ((_p = error_3.response.data) === null || _p === void 0 ? void 0 : _p.message) || 'Unknown API error'
                            }];
                    }
                    if (error_3 instanceof Error) {
                        return [2 /*return*/, { success: false, error: error_3.message }];
                    }
                    return [2 /*return*/, {
                            success: false,
                            error: "An unexpected error occurred while creating Smartship NDR request"
                        }];
                case 16: return [2 /*return*/];
            }
        });
    });
}
