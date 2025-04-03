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
exports.createOnlineXpressOrder = createOnlineXpressOrder;
exports.cancelOnlineXpressOrder = cancelOnlineXpressOrder;
var axios_1 = require("axios");
var client_1 = require("@prisma/client");
var tokenManager_1 = require("./tokenManager");
var prisma_1 = require("../../lib/prisma");
var safeToNumber = function (value) {
    return value ? value.toNumber() : null;
};
function generateRandomOrderId(orderId) {
    var randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return "".concat(orderId, "-").concat(randomNum);
}
function createOnlineXpressOrder(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var token, order, warehouseAddress, warehouseDetails, warehouseResponse, warehouseError_1, customerAddress, collectableAmount, requestBody, response, awbNumber, updatedOrder, error_1;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 12, , 14]);
                    console.log("Starting createOnlineXpressOrder for orderId:", orderId);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("onlinexpress")];
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
                    order = _f.sent();
                    if (!order) {
                        console.error("Order not found for orderId: ".concat(orderId));
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findUnique({
                            where: { id: (_a = order.agentAddressId) !== null && _a !== void 0 ? _a : undefined },
                        })];
                case 3:
                    warehouseAddress = _f.sent();
                    if (!warehouseAddress) {
                        console.error("Warehouse address not found");
                        return [2 /*return*/, { success: false, error: "Warehouse address is required" }];
                    }
                    warehouseDetails = {
                        shortcode: (_b = order === null || order === void 0 ? void 0 : order.Users) === null || _b === void 0 ? void 0 : _b.StoreName,
                        customer_id: "8517",
                        address: warehouseAddress.address,
                        type: "pickup",
                        city: warehouseAddress.city,
                        pincode: warehouseAddress.pincode,
                        phone: warehouseAddress.contactNumber,
                    };
                    console.log("Warehouse creation started");
                    console.log("warehouseDetails : ", warehouseDetails);
                    _f.label = 4;
                case 4:
                    _f.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, axios_1.default.post("https://onlinexpress.co.in/admin/services/addData/pickup", warehouseDetails, {
                            headers: {
                                Accept: "application/json",
                                "Content-Type": "application/json",
                                AUTH_USER: "SHYPBUDDY INDIA PRIVATE LIMITED",
                                AUTH_PW: "".concat(token),
                            },
                        })];
                case 5:
                    warehouseResponse = _f.sent();
                    if (warehouseResponse.data.failedDetails == "SUCCESS") {
                        console.log("Warehouse creation successful");
                    }
                    else {
                        if ((_c = warehouseResponse.data.failedDetails) === null || _c === void 0 ? void 0 : _c.includes("Duplicate entry")) {
                            console.log("Warehouse already exists");
                        }
                        else {
                            console.error(JSON.stringify({
                                data: "Failed to create warehouse:",
                                messgae: warehouseResponse.data.failedDetails,
                                path: "deliverypartner/onlinexpress",
                            }));
                        }
                    }
                    return [3 /*break*/, 7];
                case 6:
                    warehouseError_1 = _f.sent();
                    console.warn("Warehouse creation failed, proceeding with existing warehouse:", warehouseError_1);
                    return [3 /*break*/, 7];
                case 7:
                    customerAddress = order.customerAddress;
                    collectableAmount = ((_d = order.paymentMode) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === "cod" ? order.totalOrderValue : 0;
                    requestBody = {
                        type: "regular",
                        result: [
                            {
                                "AWB NO": "",
                                "REFRENCE NO": generateRandomOrderId(order.orderId),
                                "SKU CODE": "Product Details",
                                "CLIENT NAME": "SHYPBUDDY INDIA PRIVATE LIMITED",
                                "CONSIGNEE NAME": customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.fullName,
                                ADDRESS: customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.address,
                                ORIGIN: "Delhi",
                                // "DESTINATION": customerAddress?.city,
                                DESTINATION: "Delhi",
                                // "PINCODE": customerAddress?.pincode,
                                PINCODE: customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.pincode,
                                "MOBILE NO": customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.contactNumber,
                                "ALT MOBILE NO": (customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.alternateNumber) || "",
                                MODE: order.paymentMode,
                                WEIGHT: order.applicableWeight,
                                "DECLARE VALUE": order.totalOrderValue,
                                "CALLECTABLE AMOUNT": collectableAmount,
                                "BOOKING DATE": new Date(),
                                QUANTITY: "1",
                                "DELIVERY DATE": "",
                                "HUB ADDRESS": (_e = order === null || order === void 0 ? void 0 : order.Users) === null || _e === void 0 ? void 0 : _e.StoreName,
                                ESSENTIAL: "",
                                DADDRESS: warehouseAddress.address,
                                DCITY: warehouseAddress.city,
                                DPINCODE: warehouseAddress.pincode,
                                DPHONE: warehouseAddress.contactNumber,
                                PRODUCTS: order.Packages.map(function (item) { return ({
                                    "SKU CODE": item.sku || "dummy SKU",
                                    QUANTITY: item.quantity,
                                    BRAND: "",
                                    COLOR: "",
                                    REASON: "",
                                    IMAGES: "",
                                }); }),
                            },
                        ],
                        branch_id: "1",
                        user: "SHYPBUDDY INDIA PRIVATE LIMITED",
                        from_api: "y",
                    };
                    console.log("Online Xpress API request body:", JSON.stringify(requestBody, null, 2));
                    console.log("About to make Online Xpress API call for shipping");
                    return [4 /*yield*/, axios_1.default.post("https://onlinexpress.co.in/admin/services/booking", requestBody, {
                            headers: {
                                Accept: "application/json",
                                "Content-Type": "application/json",
                                AUTH_USER: "SHYPBUDDY INDIA PRIVATE LIMITED",
                                AUTH_PW: "".concat(token),
                            },
                        })];
                case 8:
                    response = _f.sent();
                    //   console.log("Online Xpress API call completed");
                    console.log("Online Xpress API response:", JSON.stringify({
                        data: response.data,
                        path: "deliveryPartner/onlinexpress",
                    }));
                    if (!(response.data && response.data.success)) return [3 /*break*/, 10];
                    awbNumber = response.data.successfulAWBS[0];
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
                    // console.log("Updated order with shipment details:", updatedOrder);
                    // revalidatePath("/orders");
                    return [2 /*return*/, { success: true, awbNumber: awbNumber }];
                case 10:
                    console.error(JSON.stringify({
                        message: "Failed to create Online Xpress order: ".concat(response.data.message || "Unknown error"),
                        path: "deliverypartner/onlinexpress",
                    }));
                    _f.label = 11;
                case 11: return [3 /*break*/, 14];
                case 12:
                    error_1 = _f.sent();
                    console.error(JSON.stringify({
                        message: "Error creating Online Xpress shipment:",
                        errorDetails: error_1,
                        path: "deliverypartner/onlinexpress",
                    }));
                    // Update order status to CANCELLED if shipment creation fails
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { id: orderId },
                            data: { status: "NEW" },
                        })];
                case 13:
                    // Update order status to CANCELLED if shipment creation fails
                    _f.sent();
                    if (error_1 instanceof Error) {
                        return [2 /*return*/, { success: false, error: error_1.message }];
                    }
                    else {
                        return [2 /*return*/, { success: false, error: "An unknown error occurred" }];
                    }
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
function cancelOnlineXpressOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var token, response, order, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("onlinexpress")];
                case 1:
                    token = _a.sent();
                    return [4 /*yield*/, axios_1.default.get("https://onlinexpress.co.in/admin/services/cancelRequest?awbs=".concat(awbNumber), {
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                                AUTH_USER: "SHYPBUDDY INDIA PRIVATE LIMITED",
                                AUTH_PW: "".concat(token),
                            },
                        })];
                case 2:
                    response = _a.sent();
                    if (!(response.data.failure.length == 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { awbNumber: awbNumber },
                        })];
                case 3:
                    order = _a.sent();
                    if (!order) {
                        console.error("Order with AWB number ".concat(awbNumber, " not found in the database."));
                        return [2 /*return*/, { success: false, message: "Order not found in the database" }];
                    }
                    console.log("Order with AWB number ".concat(awbNumber, " has been successfully cancelled."));
                    // revalidatePath(`/orders`);
                    return [2 /*return*/, { success: true, message: "Order cancelled successfully" }];
                case 4:
                    JSON.stringify({
                        message: "Error cancelling  order:",
                        errorDetails: response.status,
                        path: "deliverypartner/onlineexpress",
                    });
                    return [2 /*return*/, { success: false, message: "Order cancellation unsuccessfully" }];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.error(JSON.stringify({
                        message: "Error cancelling order:",
                        errorDetails: error_2,
                        path: "deliverypartner/onlineexpress",
                    }));
                    return [2 /*return*/, {
                            success: false,
                            message: "An unexpected error occurred. Please try again.",
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
