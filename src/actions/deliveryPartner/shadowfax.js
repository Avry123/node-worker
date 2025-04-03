"use strict";
// "use server";
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
exports.createShadowfaxOrder = createShadowfaxOrder;
exports.createReverseShadowfaxOrder = createReverseShadowfaxOrder;
exports.cancelShadowfaxOrder = cancelShadowfaxOrder;
exports.cancelReverseShadowfaxOrder = cancelReverseShadowfaxOrder;
var axios_1 = require("axios");
var client_1 = require("@prisma/client");
var tokenManager_1 = require("./tokenManager");
var prisma_1 = require("../../lib/prisma");
function generateRandomOrderId(orderId) {
    var randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return "".concat(orderId, "-").concat(randomNum);
}
function createShadowfaxOrder(orderId, type) {
    return __awaiter(this, void 0, void 0, function () {
        var token, clientOrderId, order, warehouseAddress, rtoWarehouseAddress, customerAddress, collectableAmount, requestBody, response, awbNumber, updatedOrder, safeToNumber, error_1, errorMessage;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 10, , 11]);
                    token = void 0;
                    if (!(type == "surface")) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("shadowfax")];
                case 1:
                    token = _f.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!(type == "sdd/ndd")) return [3 /*break*/, 4];
                    console.log("Shadowfax SDD/NDD token");
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("shadowfaxsdd")];
                case 3:
                    token = _f.sent();
                    _f.label = 4;
                case 4:
                    clientOrderId = orderId + Math.floor(100 + Math.random() * 900).toString();
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
                case 5:
                    order = _f.sent();
                    if (!order) {
                        console.error("Order not found");
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findFirst({
                            where: {
                                id: order.agentAddressId || undefined,
                            },
                        })];
                case 6:
                    warehouseAddress = _f.sent();
                    return [4 /*yield*/, prisma_1.default.address.findUnique({
                            where: { id: (_a = order.rtoAgentAddressId) !== null && _a !== void 0 ? _a : undefined },
                        })];
                case 7:
                    rtoWarehouseAddress = _f.sent();
                    if (!warehouseAddress || !rtoWarehouseAddress) {
                        console.error("Warehouse address or RTO warehouse address not found");
                        return [2 /*return*/, { success: false, error: "Warehouse not found" }];
                    }
                    customerAddress = order.customerAddress;
                    if (!customerAddress) {
                        console.error("Customer address not found");
                        return [2 /*return*/, { success: false, error: "Customer address not found" }];
                    }
                    collectableAmount = ((_b = order.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "prepaid"
                        ? 0
                        : order.totalOrderValue;
                    requestBody = {
                        order_type: "marketplace",
                        order_details: {
                            client_order_id: generateRandomOrderId(order.orderId),
                            actual_weight: order.applicableWeight,
                            product_value: order.totalOrderValue,
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
                            name: ((_c = order === null || order === void 0 ? void 0 : order.Users) === null || _c === void 0 ? void 0 : _c.StoreName) || warehouseAddress.tag,
                            contact: String(warehouseAddress.contactNumber),
                            address_line_1: warehouseAddress.address,
                            address_line_2: warehouseAddress.landmark,
                            city: warehouseAddress.city,
                            state: warehouseAddress.state,
                            pincode: warehouseAddress.pincode,
                        },
                        rto_details: {
                            name: ((_d = order === null || order === void 0 ? void 0 : order.Users) === null || _d === void 0 ? void 0 : _d.StoreName) || rtoWarehouseAddress.tag,
                            contact: String(rtoWarehouseAddress.contactNumber),
                            address_line_1: rtoWarehouseAddress.address,
                            address_line_2: rtoWarehouseAddress.landmark,
                            city: rtoWarehouseAddress.city,
                            state: rtoWarehouseAddress.state,
                            pincode: rtoWarehouseAddress.pincode,
                            unique_code: ((_e = order === null || order === void 0 ? void 0 : order.Users) === null || _e === void 0 ? void 0 : _e.StoreName) || rtoWarehouseAddress.tag,
                        },
                        product_details: order.Packages.map(function (item) { return ({
                            hsn_code: item.hsn || "N/A",
                            sku_name: item.productName,
                            sku_id: item.sku || "N/A",
                            category: item.category || "N/A",
                            price: Number(item.price),
                        }); }),
                    };
                    return [4 /*yield*/, axios_1.default.post("https://dale.shadowfax.in/api/v3/clients/orders/", requestBody, {
                            headers: {
                                Authorization: "Token ".concat(token),
                                "Content-Type": "application/json",
                            },
                        })];
                case 8:
                    response = _f.sent();
                    console.log(JSON.stringify(requestBody), "requestBody for shadowfax");
                    //console.log('hi',response.data)
                    if (response.data.message !== "Success") {
                        console.error(JSON.stringify({
                            errorDetails: response.data.errors,
                            path: "deliveryPartner/shadowfax",
                        }));
                        return [2 /*return*/, { success: false, error: response.data.errors }];
                    }
                    awbNumber = response.data.data.awb_number;
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { id: orderId },
                            data: {
                                status: client_1.OrderStatus.READY_TO_SHIP,
                                awbNumber: awbNumber,
                                shippingDate: new Date(),
                            },
                        })];
                case 9:
                    updatedOrder = _f.sent();
                    safeToNumber = function (value) {
                        return value ? value.toNumber() : null;
                    };
                    return [2 /*return*/, {
                            success: true,
                            order: __assign(__assign({}, updatedOrder), { deadWeight: safeToNumber(updatedOrder.deadWeight), breadth: safeToNumber(updatedOrder.breadth), height: safeToNumber(updatedOrder.height), length: safeToNumber(updatedOrder.length), applicableWeight: safeToNumber(updatedOrder.applicableWeight), totalOrderValue: safeToNumber(updatedOrder.totalOrderValue) }),
                            awbNumber: awbNumber,
                            clientOrderId: clientOrderId, // Include it in the return value if needed for reference
                        }];
                case 10:
                    error_1 = _f.sent();
                    errorMessage = "An unknown error occurred";
                    if (error_1.response && error_1.response.data && error_1.response.data.errors) {
                        errorMessage = error_1.response.data.errors;
                    }
                    else if (error_1 instanceof Error) {
                        errorMessage = error_1.message;
                    }
                    return [2 /*return*/, { success: false, error: errorMessage }];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// export async function downloadShadowfaxLabel(
//   awbNumber: string,
// ): Promise<string> {
//   // Implement label download logic here
//   console.error("Not implemented");
// }
function createReverseShadowfaxOrder(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var token, order, pickupAddress, customerAddress_1, requestBody, response_1, result, error_2;
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("shadowfax")];
                case 1:
                    token = _h.sent();
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
                    order = _h.sent();
                    if (!order) {
                        console.error("Order not found");
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    return [4 /*yield*/, prisma_1.default.customerAddress.findFirst({
                            where: {
                                customerId: order.reverseAgentAddressId || undefined,
                            },
                        })];
                case 3:
                    pickupAddress = _h.sent();
                    if (!pickupAddress) {
                        console.error("Warehouse address not found");
                        return [2 /*return*/, { success: false, error: "Warehouse address not found" }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findFirst({
                            where: {
                                id: order.reverseCustomerId || undefined,
                            },
                        })];
                case 4:
                    customerAddress_1 = _h.sent();
                    requestBody = {
                        // Required string fields
                        client_order_number: generateRandomOrderId(order.orderId),
                        warehouse_name: ((_a = order === null || order === void 0 ? void 0 : order.Users) === null || _a === void 0 ? void 0 : _a.StoreName) || (customerAddress_1 === null || customerAddress_1 === void 0 ? void 0 : customerAddress_1.tag),
                        warehouse_address: (customerAddress_1 === null || customerAddress_1 === void 0 ? void 0 : customerAddress_1.address) || "Client Warehouse Address",
                        destination_pincode: customerAddress_1 === null || customerAddress_1 === void 0 ? void 0 : customerAddress_1.pincode,
                        unique_code: "warehouse".concat(orderId),
                        pickup_type: "regular",
                        // Required number fields
                        total_amount: order.totalOrderValue,
                        price: ((_b = order.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "prepaid"
                            ? 0
                            : order.totalOrderValue,
                        // Required if total_amount > 50000
                        eway_bill: "",
                        // Required address_attributes
                        address_attributes: {
                            address_line: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.address,
                            city: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.city,
                            country: "India", // Added from first example
                            pincode: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.pincode,
                            name: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.fullName,
                            phone_number: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.contactNumber,
                            // Optional address fields
                            alternate_contact: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.alternateNumber,
                            sms_contact: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.contactNumber,
                            latitude: "0.00000",
                            longitude: "0.00000",
                            location_accuracy: "L",
                            location_type: "residential",
                        },
                        // Required skus_attributes array
                        skus_attributes: order.Packages.map(function (item) { return ({
                            // Required SKU fields
                            name: item.productName || "N/A",
                            price: parseFloat(item.price) || 0,
                            client_sku_id: item.sku || "N/A",
                            hsn_code: item.hsn || "",
                            invoice_id: " ",
                            return_reason: "",
                            // Required seller_details
                            seller_details: {
                                regd_name: (customerAddress_1 === null || customerAddress_1 === void 0 ? void 0 : customerAddress_1.tag) || "N/A",
                                regd_address: (customerAddress_1 === null || customerAddress_1 === void 0 ? void 0 : customerAddress_1.address) || "N/A",
                                state: (customerAddress_1 === null || customerAddress_1 === void 0 ? void 0 : customerAddress_1.state) || "N/A",
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
                        }); }),
                    };
                    return [4 /*yield*/, axios_1.default.post("https://dale.shadowfax.in/api/v3/clients/requests", requestBody, {
                            headers: {
                                Authorization: "Token ".concat(token),
                                "Content-Type": "application/json",
                            },
                        })];
                case 5:
                    response_1 = _h.sent();
                    console.log(requestBody, "requestBody for shadowfax");
                    console.log("dataaa", response_1, "response for shadowfax");
                    if (!(response_1.data.message === "Success")) return [3 /*break*/, 7];
                    return [4 /*yield*/, prisma_1.default.$transaction(function (prismaTransaction) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prismaTransaction.orders.update({
                                            where: { id: orderId },
                                            data: {
                                                status: client_1.OrderStatus.READY_TO_SHIP,
                                                awbNumber: response_1.data.awb_number,
                                                shippingDate: new Date(),
                                            },
                                        })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 6:
                    result = _h.sent();
                    return [2 /*return*/, {
                            success: true,
                            awbNumber: response_1.data.awb_number,
                        }];
                case 7: return [2 /*return*/, {
                        success: false,
                        error: response_1.data.errors ||
                            response_1.data.message ||
                            "Failed to create Shadowfax order",
                    }];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_2 = _h.sent();
                    if (axios_1.default.isAxiosError(error_2)) {
                        // Detailed Axios error handling
                        console.error("Axios Error Response:", (_c = error_2.response) === null || _c === void 0 ? void 0 : _c.data);
                        console.error("Axios Error Status:", (_d = error_2.response) === null || _d === void 0 ? void 0 : _d.status);
                        console.error("Axios Error Headers:", (_e = error_2.response) === null || _e === void 0 ? void 0 : _e.headers);
                        console.error("Axios Error Message:", error_2.message);
                        return [2 /*return*/, {
                                success: false,
                                error: "Failed to create Shadowfax order: ".concat(((_g = (_f = error_2.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.message) || error_2.message || "Unknown error"),
                            }];
                    }
                    else {
                        // General error handling
                        console.error("Error in createReverseShadowfaxOrder:", error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: error_2 instanceof Error
                                    ? error_2.message
                                    : "Failed to create Shadowfax order",
                            }];
                    }
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function cancelShadowfaxOrder(awbNumber, type) {
    return __awaiter(this, void 0, void 0, function () {
        var token, requestBody, response, errorMessage, error_3, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    token = void 0;
                    if (!(type == "surface")) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("shadowfax")];
                case 1:
                    token = _a.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!(type == "sdd/ndd")) return [3 /*break*/, 4];
                    console.log("Shadowfax SDD/NDD token");
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("shadowfaxsdd")];
                case 3:
                    token = _a.sent();
                    _a.label = 4;
                case 4:
                    requestBody = {
                        request_id: awbNumber,
                    };
                    return [4 /*yield*/, axios_1.default.post("https://dale.shadowfax.in/api/v3/clients/orders/cancel/", requestBody, {
                            headers: {
                                Authorization: "Token ".concat(token),
                                "Content-Type": "application/json",
                            },
                        })];
                case 5:
                    response = _a.sent();
                    //   console.log("Shadowfax Cancel API Response:", response.data);
                    if (response.data.responseMsg === "Request has been marked as cancelled" ||
                        response.data.responseMsg ===
                            "The request is already in its cancellation phase" ||
                        response.data.responseMsg ===
                            "Cannot cancel order from Cancelled By Customer" ||
                        response.data.responseCode === 200) {
                        return [2 /*return*/, {
                                success: true,
                                message: response.data.responseMsg || "Order cancelled successfully",
                            }];
                    }
                    else {
                        errorMessage = response.data.responseMsg || "Failed to cancel order with Shadowfax";
                        console.error(JSON.stringify({
                            message: "Failed cancelling Shadowfax order:",
                            errorDetails: errorMessage,
                            path: "deliveryPartner/shadowfax",
                        }));
                        return [2 /*return*/, {
                                success: false,
                                message: errorMessage,
                            }];
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    errorMessage = error_3 instanceof Error
                        ? error_3.message
                        : "Failed to cancel Shadowfax order";
                    console.error(JSON.stringify({
                        message: "Error cancelling Shadowfax order:",
                        errorDetails: error_3,
                        path: "deliveryPartner/shadowfax",
                    }));
                    return [2 /*return*/, {
                            success: false,
                            message: errorMessage,
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function cancelReverseShadowfaxOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var token, requestBody, response, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("Shadowfax")];
                case 1:
                    token = _a.sent();
                    requestBody = {
                        request_id: awbNumber,
                        cancel_remarks: "cancelled by customer",
                    };
                    return [4 /*yield*/, axios_1.default.post("https://dale.shadowfax.in/api/v2/clients/requests/mark_cancel", requestBody, {
                            headers: {
                                Authorization: "Token ".concat(token),
                                "Content-Type": "application/json",
                            },
                        })];
                case 2:
                    response = _a.sent();
                    //console.log("Shadowfax Cancel API Response:", response.data);
                    if (response.data.responseCode === 200) {
                        //console.log("Order cancellation successful");
                        return [2 /*return*/, {
                                success: true,
                                message: "Order cancelled successfully",
                                data: response.data,
                            }];
                    }
                    else {
                        console.error(JSON.stringify({
                            data: "Failed to cancel order:",
                            meesage: response.data.message || response.statusText,
                            path: "deliveryPartner/shadowfax",
                        }));
                        return [2 /*return*/, {
                                success: false,
                                message: response.data.message || "Failed to cancel order with Shadowfax",
                                data: response.data,
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.error(JSON.stringify({
                        data: "Error cancelling Shadowfax order:",
                        message: error_4,
                    }));
                    return [2 /*return*/, {
                            success: false,
                            message: error_4 instanceof Error
                                ? error_4.message
                                : "Failed to cancel Shadowfax order",
                            error: error_4,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
