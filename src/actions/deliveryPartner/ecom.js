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
exports.CreateReverseEcomOrder = CreateReverseEcomOrder;
exports.cancelEcomOrder = cancelEcomOrder;
exports.createForwardEcomOrder = createForwardEcomOrder;
exports.CancelForwardEcom = CancelForwardEcom;
exports.createEcomExpressNdr = createEcomExpressNdr;
var axios_1 = require("axios");
var client_1 = require("@prisma/client");
var prisma_1 = require("../../lib/prisma");
function CreateReverseEcomOrder(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var responseOrderId, order, pickupAddress, customerAddress, collectableAmount, awbParams, awbResponse, awb, paymentMode, itemDescription, isEssentialProduct, manifestParams, manifestResponse, successfulShipment, updatedOrder, safeToNumber, error_1, errorMessage;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 7, , 8]);
                    console.log("Inside Ecom");
                    responseOrderId = orderId + Math.floor(100 + Math.random() * 900).toString();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { id: orderId },
                            include: {
                                reverseCustomerAddress: true,
                                Packages: true,
                                Users: {
                                    select: {
                                        StoreName: true,
                                    },
                                },
                            },
                        })];
                case 1:
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
                case 2:
                    pickupAddress = _h.sent();
                    if (!pickupAddress) {
                        console.error("Warehouse address or RTO warehouse address not found");
                        return [2 /*return*/, {
                                success: false,
                                error: "Warehouse address or RTO warehouse address not found",
                            }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findFirst({
                            where: {
                                id: order.reverseCustomerId || undefined,
                            },
                        })];
                case 3:
                    customerAddress = _h.sent();
                    if (!customerAddress) {
                        console.error("Customer address not found");
                        return [2 /*return*/, { success: false, error: "Customer address not found" }];
                    }
                    collectableAmount = 0;
                    awbParams = new URLSearchParams();
                    awbParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED-EXSPLUS713662");
                    awbParams.append("password", "Hqd324rJo7");
                    awbParams.append("count", "1");
                    awbParams.append("type", "EXPP");
                    return [4 /*yield*/, axios_1.default.post("https://Shipment.ecomexpress.in/services/shipment/products/v2/fetch_awb/", awbParams)];
                case 4:
                    awbResponse = _h.sent();
                    if (awbResponse.data.success !== "yes") {
                        console.error("Failed to generate AWB");
                    }
                    awb = awbResponse.data.awb;
                    paymentMode = collectableAmount > 0 ? "COD" : "PPD";
                    itemDescription = order.Packages
                        .map(function (pkg) {
                        var productInfo = [];
                        if (pkg.productName)
                            productInfo.push(pkg.productName);
                        if (pkg.image)
                            productInfo.push("Image: ".concat(pkg.image));
                        return productInfo.join(" - ");
                    })
                        .filter(Boolean)
                        .join(", ");
                    isEssentialProduct = ((_a = order.Packages[0]) === null || _a === void 0 ? void 0 : _a.category) === "BabyAndToddler" ||
                        ((_b = order.Packages[0]) === null || _b === void 0 ? void 0 : _b.category) === "GroceryAndGourmetFood" ||
                        ((_c = order.Packages[0]) === null || _c === void 0 ? void 0 : _c.category) === "HealthAndHousehold"
                        ? "Y"
                        : "N";
                    manifestParams = new URLSearchParams();
                    manifestParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED-EXSPLUS713662");
                    manifestParams.append("password", "Hqd324rJo7");
                    manifestParams.append("json_input", JSON.stringify([
                        {
                            AWB_NUMBER: awb.toString(),
                            ORDER_NUMBER: responseOrderId,
                            PRODUCT: paymentMode,
                            CONSIGNEE: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.fullName,
                            CONSIGNEE_ADDRESS1: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.address,
                            DESTINATION_CITY: pickupAddress.city,
                            STATE: pickupAddress.state,
                            PINCODE: pickupAddress.pincode.toString(),
                            TELEPHONE: pickupAddress.contactNumber,
                            MOBILE: pickupAddress.contactNumber,
                            RETURN_NAME: ((_d = order === null || order === void 0 ? void 0 : order.Users) === null || _d === void 0 ? void 0 : _d.StoreName) || customerAddress.tag,
                            RETURN_MOBILE: customerAddress.contactNumber,
                            RETURN_PINCODE: customerAddress.pincode.toString(),
                            RETURN_ADDRESS_LINE1: customerAddress.address,
                            RETURN_PHONE: customerAddress.alternateNumber,
                            PICKUP_NAME: pickupAddress.fullName,
                            PICKUP_PINCODE: pickupAddress.pincode.toString(),
                            PICKUP_MOBILE: pickupAddress.contactNumber,
                            PICKUP_PHONE: pickupAddress.alternateNumber,
                            PICKUP_ADDRESS_LINE1: pickupAddress.address,
                            COLLECTABLE_VALUE: collectableAmount === null || collectableAmount === void 0 ? void 0 : collectableAmount.toString(),
                            DECLARED_VALUE: (_e = order.totalOrderValue) === null || _e === void 0 ? void 0 : _e.toString(),
                            ITEM_DESCRIPTION: itemDescription,
                            DG_SHIPMENT: order.isDangerous ? "Y" : "N",
                            PIECES: order.Packages.length,
                            LENGTH: order.length + ".0",
                            BREADTH: order.breadth + ".0",
                            HEIGHT: order.height + ".0",
                            VOLUMETRIC_WEIGHT: Number(order.deadWeight),
                            ACTUAL_WEIGHT: Number(order.applicableWeight),
                            ADDITIONAL_INFORMATION: [{}],
                            GST_TAX_RATE_SGSTN: 0,
                            GST_TAX_IGSTN: 0,
                            DISCOUNT: 0,
                            GST_TAX_RATE_IGSTN: 0,
                            GST_TAX_BASE: 0,
                            GST_TAX_SGSTN: 0,
                            INVOICE_DATE: customerAddress.createdAt,
                            SELLER_GSTIN: "",
                            GST_TAX_RATE_CGSTN: 0,
                            GST_HSN: ((_f = order.Packages[0]) === null || _f === void 0 ? void 0 : _f.hsn) || "",
                            GST_TAX_NAME: "",
                            INVOICE_NUMBER: "0",
                            GST_TAX_TOTAL: 1,
                            GST_TAX_CGSTN: 0,
                            GST_ERN: "0",
                            ESSENTIAL_PRODUCT: isEssentialProduct,
                            CONSIGNEE_LAT: "0",
                            CONSIGNEE_LONG: "0",
                        },
                    ]));
                    return [4 /*yield*/, axios_1.default.post("https://shipment.ecomexpress.in/services/expp/manifest/v2/expplus/", manifestParams)];
                case 5:
                    manifestResponse = _h.sent();
                    console.log("manifest params:", manifestParams);
                    successfulShipment = (_g = manifestResponse.data.shipments) === null || _g === void 0 ? void 0 : _g[0];
                    if (!successfulShipment || !successfulShipment.success) {
                        console.error((successfulShipment === null || successfulShipment === void 0 ? void 0 : successfulShipment.reason) || "Manifest creation failed");
                    }
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { id: orderId },
                            data: {
                                status: client_1.OrderStatus.READY_TO_SHIP,
                                awbNumber: awb.toString(),
                                shippingDate: new Date(),
                            },
                        })];
                case 6:
                    updatedOrder = _h.sent();
                    safeToNumber = function (value) {
                        return value ? value.toNumber() : null;
                    };
                    return [2 /*return*/, {
                            success: true,
                            order: __assign(__assign({}, updatedOrder), { deadWeight: safeToNumber(updatedOrder.deadWeight), breadth: safeToNumber(updatedOrder.breadth), height: safeToNumber(updatedOrder.height), length: safeToNumber(updatedOrder.length), applicableWeight: safeToNumber(updatedOrder.applicableWeight), totalOrderValue: safeToNumber(updatedOrder.totalOrderValue) }),
                            awbNumber: awb.toString(),
                        }];
                case 7:
                    error_1 = _h.sent();
                    console.error(JSON.stringify({
                        message: "Error in CreateReverseEcomOrder:",
                        errorDetails: error_1,
                        path: "deliverypartner/ecom",
                    }));
                    errorMessage = "An unknown error occurred";
                    if (error_1.response) {
                        errorMessage =
                            error_1.response.data.message || "Unknown API error occurred";
                    }
                    else if (error_1.request) {
                        errorMessage = "No response received from the server.";
                    }
                    else if (error_1 instanceof Error) {
                        errorMessage = error_1.message;
                    }
                    return [2 /*return*/, { success: false, error: errorMessage }];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function cancelEcomOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var params, response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    params = new URLSearchParams();
                    params.append("username", "SHYPBUDDYINDIAPRIVATELIMITED-EXSPLUS713662");
                    params.append("password", "Hqd324rJo7");
                    params.append("awbs", awbNumber);
                    return [4 /*yield*/, axios_1.default.post("https://api.ecomexpress.in/apiv2/cancel_awb/", params)];
                case 1:
                    response = _a.sent();
                    // console.log("Order cancellation response:", response.data);
                    if (response.data[0].success == true ||
                        response.data[0].reason ==
                            "Shipment Cannot Be Cancelled As RTO Lock Already Applied") {
                        console.log("Order with AWB number ".concat(awbNumber, " has been successfully cancelled."));
                        return [2 /*return*/, { success: true, message: "Order was successfully canceled" }];
                    }
                    return [2 /*return*/, { success: false, message: "Order cancellation failed" }];
                case 2:
                    error_2 = _a.sent();
                    console.error(JSON.stringify({
                        message: "Error cancelling Ecom order:",
                        errorDetails: error_2,
                        path: "deliverypartner/ecom",
                    }));
                    if (error_2.response && error_2.response.data) {
                        console.error(JSON.stringify({
                            message: "Error cancelling Ecom order:",
                            errorDetails: error_2.response.data,
                            path: "deliverypartner/ecom",
                        }));
                    }
                    return [2 /*return*/, { success: false, message: "Failed to cancel Ecom order" }];
                case 3: return [2 /*return*/];
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
function createForwardEcomOrder(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var order, warehouseAddress, rtoWarehouseAddress, customerAddress, isHeavyWeight, awbType, collectableAmount, productNames, hsn, orderCategory, isEssentialProduct, awbParams, awbResponse, awb, manifestParams, manifestResponse, failedShipment, errorReason, successfulShipment, updatedOrder, safeToNumber, error_3, errorMessage;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    _k.trys.push([0, 7, , 8]);
                    console.log("Inside Forward Ecom Order Creation");
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
                case 1:
                    order = _k.sent();
                    if (!order) {
                        console.error("Order not found");
                        return [2 /*return*/, { success: false, message: "Order not found" }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findFirst({
                            where: {
                                id: order.agentAddressId || undefined,
                            },
                        })];
                case 2:
                    warehouseAddress = _k.sent();
                    return [4 /*yield*/, prisma_1.default.address.findUnique({
                            where: { id: (_a = order.rtoAgentAddressId) !== null && _a !== void 0 ? _a : undefined },
                        })];
                case 3:
                    rtoWarehouseAddress = _k.sent();
                    if (!warehouseAddress || !rtoWarehouseAddress) {
                        console.error("Warehouse address or RTO warehouse address not found");
                        return [2 /*return*/, {
                                success: false,
                                message: "Warehouse address or RTO warehouse address not found",
                            }];
                    }
                    customerAddress = order.customerAddress;
                    if (!customerAddress) {
                        console.error("Customer address not found");
                        return [2 /*return*/, { success: false, message: "Customer address not found" }];
                    }
                    isHeavyWeight = Number(order.applicableWeight) > 5;
                    awbType = void 0;
                    awbType = ((_b = order.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "prepaid" ? "PPD" : "COD";
                    collectableAmount = ((_c = order.paymentMode) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === "prepaid"
                        ? 0
                        : order.totalOrderValue;
                    productNames = order.Packages.map(function (pkg) { return pkg.productName; })
                        .filter(Boolean)
                        .join(", ");
                    hsn = order.Packages.map(function (pkg) { return pkg.hsn; })
                        .filter(Boolean)
                        .join(", ");
                    orderCategory = (_d = order.Packages[0]) === null || _d === void 0 ? void 0 : _d.category;
                    isEssentialProduct = orderCategory === "BabyAndToddler" ||
                        "GroceryAndGourmetFood" ||
                        "HealthAndHousehold"
                        ? "Y"
                        : "N";
                    awbParams = new URLSearchParams();
                    awbParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
                    awbParams.append("password", "w5kzZECMxO");
                    awbParams.append("count", "1");
                    awbParams.append("type", awbType);
                    return [4 /*yield*/, axios_1.default.post("https://api.ecomexpress.in/apiv2/fetch_awb/", awbParams)];
                case 4:
                    awbResponse = _k.sent();
                    if (awbResponse.data.success !== "yes") {
                        console.error("Failed to generate AWB");
                    }
                    awb = awbResponse.data.awb;
                    manifestParams = new URLSearchParams();
                    manifestParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
                    manifestParams.append("password", "w5kzZECMxO");
                    manifestParams.append("json_input", JSON.stringify([
                        {
                            AWB_NUMBER: awb.toString(),
                            ORDER_NUMBER: generateRandomOrderId(order.orderId),
                            PRODUCT: awbType,
                            CONSIGNEE: customerAddress.fullName,
                            CONSIGNEE_ADDRESS1: customerAddress.address,
                            DESTINATION_CITY: customerAddress.city,
                            STATE: customerAddress.state,
                            PINCODE: customerAddress.pincode.toString(),
                            TELEPHONE: customerAddress.contactNumber,
                            MOBILE: customerAddress.contactNumber,
                            RETURN_NAME: ((_e = order === null || order === void 0 ? void 0 : order.Users) === null || _e === void 0 ? void 0 : _e.StoreName) || rtoWarehouseAddress.tag,
                            RETURN_MOBILE: rtoWarehouseAddress.contactNumber || warehouseAddress.contactNumber,
                            RETURN_PINCODE: rtoWarehouseAddress.pincode.toString() ||
                                warehouseAddress.pincode.toString(),
                            RETURN_ADDRESS_LINE1: rtoWarehouseAddress.address || warehouseAddress.address,
                            RETURN_PHONE: rtoWarehouseAddress.alternateNumber ||
                                warehouseAddress.alternateNumber,
                            PICKUP_NAME: ((_f = order === null || order === void 0 ? void 0 : order.Users) === null || _f === void 0 ? void 0 : _f.StoreName) || warehouseAddress.tag,
                            PICKUP_PINCODE: warehouseAddress.pincode.toString(),
                            PICKUP_MOBILE: warehouseAddress.contactNumber,
                            PICKUP_PHONE: warehouseAddress.alternateNumber,
                            PICKUP_ADDRESS_LINE1: warehouseAddress.address,
                            COLLECTABLE_VALUE: collectableAmount === null || collectableAmount === void 0 ? void 0 : collectableAmount.toString(),
                            DECLARED_VALUE: (_g = order.totalOrderValue) === null || _g === void 0 ? void 0 : _g.toString(),
                            ITEM_DESCRIPTION: productNames || "No items",
                            DG_SHIPMENT: order.isDangerous ? "Y" : "N",
                            PIECES: order.Packages.length,
                            LENGTH: order.length + ".0",
                            BREADTH: order.breadth + ".0",
                            HEIGHT: order.height + ".0",
                            VOLUMETRIC_WEIGHT: Number(order.deadWeight),
                            ACTUAL_WEIGHT: Number(order.applicableWeight),
                            ADDITIONAL_INFORMATION: {
                                GST_TAX_CGSTN: "0",
                                GST_TAX_IGSTN: "0",
                                GST_TAX_SGSTN: "0",
                                SELLER_GSTIN: "",
                                INVOICE_DATE: new Date().toLocaleDateString(),
                                INVOICE_NUMBER: order.orderId,
                                GST_TAX_RATE_SGSTN: "0",
                                GST_TAX_RATE_IGSTN: "0",
                                GST_TAX_RATE_CGSTN: "0",
                                GST_HSN: hsn || "NA",
                                GST_TAX_BASE: "0",
                                GST_TAX_NAME: "",
                                ESSENTIALPRODUCT: isEssentialProduct,
                                GST_TAX_TOTAL: "0",
                                CONSIGNEE_LONG: "0",
                                CONSIGNEE_LAT: "0",
                                what3words: "tall.basically.flattered",
                            },
                        },
                    ]));
                    return [4 /*yield*/, axios_1.default.post("https://api.ecomexpress.in/apiv2/manifest_awb/", manifestParams)];
                case 5:
                    manifestResponse = _k.sent();
                    console.log("hi", manifestResponse.data);
                    failedShipment = (_h = manifestResponse.data.shipments) === null || _h === void 0 ? void 0 : _h[0];
                    if (!failedShipment || !failedShipment.success) {
                        errorReason = "Manifest creation failed for Order ID: ".concat(orderId);
                        // Extract specific error reason if available
                        if (failedShipment && failedShipment.reason) {
                            errorReason = "Order ID ".concat(orderId, ": ").concat(failedShipment.reason);
                        }
                    }
                    successfulShipment = (_j = manifestResponse.data.shipments) === null || _j === void 0 ? void 0 : _j[0];
                    if (!successfulShipment ||
                        successfulShipment.success === false ||
                        successfulShipment.reason === "CONSIGNEE_PINCODE_NOT_SERVICED") {
                        console.error("Manifest creation failed");
                        return [2 /*return*/, { success: false, error: successfulShipment.reason }];
                    }
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { id: orderId },
                            data: {
                                status: client_1.OrderStatus.READY_TO_SHIP,
                                awbNumber: awb.toString(),
                                shippingDate: new Date(),
                            },
                        })];
                case 6:
                    updatedOrder = _k.sent();
                    safeToNumber = function (value) {
                        return value ? value.toNumber() : null;
                    };
                    return [2 /*return*/, {
                            success: true,
                            order: __assign(__assign({}, updatedOrder), { deadWeight: safeToNumber(updatedOrder.deadWeight), breadth: safeToNumber(updatedOrder.breadth), height: safeToNumber(updatedOrder.height), length: safeToNumber(updatedOrder.length), applicableWeight: safeToNumber(updatedOrder.applicableWeight), totalOrderValue: safeToNumber(updatedOrder.totalOrderValue) }),
                            awbNumber: awb.toString(),
                        }];
                case 7:
                    error_3 = _k.sent();
                    console.error("Error in createForwardEcomOrder:", error_3);
                    errorMessage = "An unknown error occurred";
                    if (error_3.response) {
                        errorMessage =
                            error_3.response.data.message || "Unknown API error occurred";
                    }
                    else if (error_3.request) {
                        errorMessage = "No response received from the server.";
                    }
                    else if (error_3 instanceof Error) {
                        errorMessage = error_3.message;
                    }
                    return [2 /*return*/, { success: false, error: errorMessage }];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function CancelForwardEcom(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var cancelParams, cancelResponse, responseData, cancellationResult, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log("In cancel for ecom");
                    cancelParams = new URLSearchParams();
                    cancelParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
                    cancelParams.append("password", "w5kzZECMxO");
                    cancelParams.append("awbs", awbNumber);
                    return [4 /*yield*/, axios_1.default.post("https://api.ecomexpress.in/apiv2/cancel_awb/", cancelParams)];
                case 1:
                    cancelResponse = _a.sent();
                    responseData = cancelResponse.data;
                    if (Array.isArray(responseData) && responseData.length > 0) {
                        cancellationResult = responseData[0];
                        if (cancellationResult.success === true ||
                            (cancellationResult.success === false &&
                                cancellationResult.reason === "INCORRECT_AIRWAYBILL_NUMBER") ||
                            "Shipment Cannot Be Cancelled As RTO Lock Already Applied") {
                            console.log("AWB ".concat(awbNumber, " handled successfully"));
                            return [2 /*return*/, {
                                    success: true,
                                    message: "AWB ".concat(awbNumber, " handled successfully. Reason: ").concat(cancellationResult.reason),
                                }];
                        }
                        else {
                            console.error(JSON.stringify({
                                message: "Failed to cancel AWB ".concat(awbNumber, ": ").concat(cancellationResult.reason),
                                path: "deliverypartner/ecom",
                            }));
                            return [2 /*return*/, {
                                    success: false,
                                    message: "Failed to cancel AWB ".concat(awbNumber, ": ").concat(cancellationResult.reason),
                                }];
                        }
                    }
                    else {
                        console.error("Unexpected response format from cancel AWB API");
                        return [2 /*return*/, {
                                success: false,
                                message: "Unexpected response format from cancel AWB API",
                            }];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error(JSON.stringify({
                        message: "Error cancelling AWB ".concat(awbNumber, ": ").concat(error_4),
                        path: "deliverypartner/ecom",
                    }));
                    return [2 /*return*/, {
                            success: false,
                            message: "Error cancelling AWB ".concat(awbNumber, "."),
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createEcomExpressNdr(order, data, action) {
    return __awaiter(this, void 0, void 0, function () {
        var orders, instruction, ndrRequest, tomorrow, formattedDate, addressLines, formData, response, responseData, responseItem, customerId, dbError_1, errorMessage, apiError_1, responseData, errorMessage, responseItem, error_5, responseData, errorMessage, responseItem;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting createEcomExpressNdr for AWB:", order.awbNumber);
                    console.log("Data:", data);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 14, , 15]);
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { orderId: Number(order.orderId) },
                            include: {
                                customerAddress: true,
                            },
                        })];
                case 2:
                    orders = _a.sent();
                    if (!orders) {
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    instruction = "";
                    if (action === "ndr") {
                        instruction = "RAD";
                    }
                    else if (action === "rto") {
                        instruction = "RTO";
                    }
                    else {
                        return [2 /*return*/, { success: false, error: "Invalid action specified" }];
                    }
                    ndrRequest = {
                        awb: order.awbNumber,
                        instruction: instruction,
                        comments: action === "ndr" ? "Reattempt requested" : "RTO Requested"
                    };
                    if (action === "ndr") {
                        tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        formattedDate = tomorrow.toISOString().split('T')[0].replace(/-/g, '-');
                        ndrRequest.scheduled_delivery_date = formattedDate;
                        ndrRequest.scheduled_delivery_slot = "1"; // Default to slot 1
                        if (data === null || data === void 0 ? void 0 : data.address) {
                            addressLines = data.address.split('\n', 4);
                            ndrRequest.consignee_address = {
                                CA1: addressLines[0] || "",
                                CA2: addressLines[1] || "",
                                CA3: addressLines[2] || "",
                                CA4: addressLines[3] || ""
                            };
                        }
                        if (data === null || data === void 0 ? void 0 : data.phone) {
                            ndrRequest.mobile = data.phone;
                        }
                    }
                    console.log("Ecom Express NDR request:", JSON.stringify([ndrRequest]));
                    formData = new FormData();
                    formData.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
                    formData.append("password", "w5kzZECMxO");
                    formData.append("json_input", JSON.stringify([ndrRequest]));
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 12, , 13]);
                    return [4 /*yield*/, axios_1.default.post("https://api.ecomexpress.in/apiv2/ndr_resolutions/", formData, {
                            headers: {
                                "Content-Type": "multipart/form-data"
                            }
                        })];
                case 4:
                    response = _a.sent();
                    console.log("Ecom Express NDR Response:", JSON.stringify(response.data));
                    responseData = response.data;
                    if (typeof responseData === 'string') {
                        try {
                            responseData = JSON.parse(responseData);
                        }
                        catch (parseError) {
                            console.error("Error parsing response data:", parseError);
                        }
                    }
                    if (!(Array.isArray(responseData) && responseData.length > 0)) return [3 /*break*/, 11];
                    responseItem = responseData[0];
                    if (!(responseItem.status === "true" || responseItem.success === true)) return [3 /*break*/, 10];
                    if (!((data.address || data.phone) && action === "ndr")) return [3 /*break*/, 9];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 8, , 9]);
                    customerId = orders.forwardCustomerId || orders.reverseCustomerId;
                    if (!customerId) return [3 /*break*/, 7];
                    return [4 /*yield*/, prisma_1.default.customerAddress.update({
                            where: {
                                customerId: customerId
                            },
                            data: {
                                address: data.address || undefined,
                                contactNumber: data.phone || undefined
                            }
                        })];
                case 6:
                    _a.sent();
                    console.log("Customer address updated successfully");
                    _a.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    dbError_1 = _a.sent();
                    console.error("Error updating customer address:", dbError_1);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/, {
                        success: true,
                        message: "Ecom Express ".concat(action === "ndr" ? "reattempt" : "RTO", " created successfully"),
                        data: responseItem
                    }];
                case 10:
                    errorMessage = "Failed to create Ecom Express ".concat(action);
                    if (responseItem.error && Array.isArray(responseItem.error) && responseItem.error.length > 0) {
                        errorMessage = responseItem.error[0];
                    }
                    else if (responseItem.reason) {
                        errorMessage = responseItem.reason;
                    }
                    return [2 /*return*/, {
                            success: false,
                            error: errorMessage
                        }];
                case 11: return [2 /*return*/, {
                        success: false,
                        error: "Invalid response format from Ecom Express API"
                    }];
                case 12:
                    apiError_1 = _a.sent();
                    if (axios_1.default.isAxiosError(apiError_1) && apiError_1.response) {
                        console.error("Ecom Express API Error:", {
                            status: apiError_1.response.status,
                            statusText: apiError_1.response.statusText,
                            data: JSON.stringify(apiError_1.response.data)
                        });
                        if (apiError_1.response.status === 401) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Authentication failed. Please check credentials or contact support."
                                }];
                        }
                        responseData = apiError_1.response.data;
                        if (typeof responseData === 'string') {
                            try {
                                responseData = JSON.parse(responseData);
                            }
                            catch (parseError) {
                                console.error("Error parsing error response data:", parseError);
                            }
                        }
                        errorMessage = "Error communicating with Ecom Express";
                        if (Array.isArray(responseData) && responseData.length > 0) {
                            responseItem = responseData[0];
                            if (responseItem.error && Array.isArray(responseItem.error) && responseItem.error.length > 0) {
                                errorMessage = responseItem.error[0];
                            }
                            else if (responseItem.reason) {
                                errorMessage = responseItem.reason;
                            }
                        }
                        else if (typeof responseData === 'string') {
                            errorMessage = responseData;
                        }
                        else if (responseData === null || responseData === void 0 ? void 0 : responseData.reason) {
                            errorMessage = responseData.reason;
                        }
                        else if (responseData === null || responseData === void 0 ? void 0 : responseData.message) {
                            errorMessage = responseData.message;
                        }
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    }
                    if (apiError_1 instanceof Error) {
                        return [2 /*return*/, { success: false, error: apiError_1.message }];
                    }
                    return [2 /*return*/, { success: false, error: "Unknown error occurred while creating Ecom Express NDR" }];
                case 13: return [3 /*break*/, 15];
                case 14:
                    error_5 = _a.sent();
                    console.error("Error in createEcomExpressNdr:", error_5);
                    if (axios_1.default.isAxiosError(error_5) && error_5.response) {
                        // Handle specific error codes
                        if (error_5.response.status === 401) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Authentication failed. Please check credentials or contact support."
                                }];
                        }
                        responseData = error_5.response.data;
                        if (typeof responseData === 'string') {
                            try {
                                responseData = JSON.parse(responseData);
                            }
                            catch (parseError) {
                                console.error("Error parsing error response data:", parseError);
                            }
                        }
                        errorMessage = "Error communicating with Ecom Express";
                        if (Array.isArray(responseData) && responseData.length > 0) {
                            responseItem = responseData[0];
                            if (responseItem.error && Array.isArray(responseItem.error) && responseItem.error.length > 0) {
                                errorMessage = responseItem.error[0];
                            }
                            else if (responseItem.reason) {
                                errorMessage = responseItem.reason;
                            }
                        }
                        else if (typeof responseData === 'string') {
                            errorMessage = responseData;
                        }
                        else if (responseData === null || responseData === void 0 ? void 0 : responseData.reason) {
                            errorMessage = responseData.reason;
                        }
                        else if (responseData === null || responseData === void 0 ? void 0 : responseData.message) {
                            errorMessage = responseData.message;
                        }
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    }
                    if (error_5 instanceof Error) {
                        return [2 /*return*/, { success: false, error: error_5.message }];
                    }
                    return [2 /*return*/, {
                            success: false,
                            error: "An unexpected error occurred while creating Ecom Express NDR request"
                        }];
                case 15: return [2 /*return*/];
            }
        });
    });
}
