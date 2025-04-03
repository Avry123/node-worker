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
exports.createDtdcOrder = createDtdcOrder;
exports.cancelDtdcOrder = cancelDtdcOrder;
exports.dtdcServiceable = dtdcServiceable;
var axios_1 = require("axios");
var tokenManager_1 = require("./tokenManager");
var prisma_1 = require("../../lib/prisma");
var client_1 = require("@prisma/client");
var user_1 = require("../user");
function createDtdcOrder(orderId, mode) {
    return __awaiter(this, void 0, void 0, function () {
        var token, order, weight, warehouseAddress, rtoWarehouseAddress, customerAddress, requestBody, response, awbNumber, updatedOrder, errorMessage, error_1;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        return __generator(this, function (_s) {
            switch (_s.label) {
                case 0:
                    _s.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("dtdc")];
                case 1:
                    token = _s.sent();
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
                    order = _s.sent();
                    if (!order) {
                        console.error("Order not found");
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    weight = parseFloat(((_a = order.applicableWeight) === null || _a === void 0 ? void 0 : _a.toString()) || "0");
                    if (weight > 100) {
                        console.error("Package weight exceeds DTDC's limit of 100 kg. Please split the shipment or choose a different courier.");
                    }
                    return [4 /*yield*/, prisma_1.default.address.findFirst({
                            where: {
                                id: order.agentAddressId || undefined,
                            },
                        })];
                case 3:
                    warehouseAddress = _s.sent();
                    return [4 /*yield*/, prisma_1.default.address.findUnique({
                            where: { id: (_b = order.rtoAgentAddressId) !== null && _b !== void 0 ? _b : undefined },
                        })];
                case 4:
                    rtoWarehouseAddress = _s.sent();
                    if (!warehouseAddress || !rtoWarehouseAddress) {
                        console.error("Warehouse address or RTO warehouse address not found");
                        return [2 /*return*/, {
                                success: false,
                                error: "Warehouse address or RTO warehouse address not found",
                            }];
                    }
                    customerAddress = order.customerAddress;
                    if (!customerAddress) {
                        console.error("Customer address not found");
                        return [2 /*return*/, { success: false, error: "Customer address not found" }];
                    }
                    requestBody = {
                        consignments: [
                            {
                                customer_code: "GL4949",
                                reference_number: "",
                                service_type_id: mode === "surface" ? "B2C SMART EXPRESS" : "B2C PRIORITY",
                                load_type: "NON-DOCUMENT",
                                consignment_type: "Forward",
                                dimension_unit: "cm",
                                length: ((_c = order.length) === null || _c === void 0 ? void 0 : _c.toString()) || "0",
                                width: ((_d = order.breadth) === null || _d === void 0 ? void 0 : _d.toString()) || "0",
                                height: ((_e = order.height) === null || _e === void 0 ? void 0 : _e.toString()) || "0",
                                weight_unit: "kg",
                                weight: ((_f = order.applicableWeight) === null || _f === void 0 ? void 0 : _f.toString()) || "0",
                                cod_amount: ((_g = order.paymentMode) === null || _g === void 0 ? void 0 : _g.toLowerCase()) === "prepaid"
                                    ? 0
                                    : order.totalOrderValue,
                                cod_collection_mode: ((_h = order.paymentMode) === null || _h === void 0 ? void 0 : _h.toLowerCase()) === "prepaid" ? "" : "cash",
                                declared_value: (_j = order.totalOrderValue) === null || _j === void 0 ? void 0 : _j.toString(),
                                num_pieces: order.Packages.length.toString(),
                                origin_details: {
                                    name: warehouseAddress.tag,
                                    phone: warehouseAddress.contactNumber,
                                    alternate_phone: warehouseAddress.alternateNumber || "",
                                    address_line_1: warehouseAddress.address,
                                    address_line_2: (warehouseAddress === null || warehouseAddress === void 0 ? void 0 : warehouseAddress.landmark) == " "
                                        ? "null"
                                        : warehouseAddress === null || warehouseAddress === void 0 ? void 0 : warehouseAddress.landmark,
                                    pincode: warehouseAddress.pincode.toString(),
                                    city: warehouseAddress.city,
                                    state: warehouseAddress.state,
                                },
                                destination_details: {
                                    name: customerAddress.fullName,
                                    phone: customerAddress.contactNumber,
                                    alternate_phone: customerAddress.alternateNumber || "",
                                    address_line_1: customerAddress.address,
                                    address_line_2: customerAddress.landmark || "null",
                                    pincode: customerAddress.pincode.toString(),
                                    city: customerAddress.city,
                                    state: customerAddress.state,
                                },
                                pieces_detail: order.Packages.map(function (item) { return ({
                                    description: item.productName,
                                    declared_value: item.price,
                                    weight: "0",
                                    height: "0",
                                    length: "0",
                                    width: "0",
                                }); }),
                            },
                        ],
                    };
                    return [4 /*yield*/, axios_1.default.post("https://dtdcapi.shipsy.io/api/customer/integration/consignment/softdata", requestBody, {
                            headers: {
                                "api-key": "".concat(token),
                                "Content-Type": "application/json",
                            },
                        })];
                case 5:
                    response = _s.sent();
                    console.log("request body for dtdc", JSON.stringify(requestBody));
                    if (!(((_m = (_l = (_k = response.data) === null || _k === void 0 ? void 0 : _k.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.success) === true)) return [3 /*break*/, 7];
                    awbNumber = (_o = response.data) === null || _o === void 0 ? void 0 : _o.data[0].reference_number;
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { id: order.id },
                            data: {
                                status: client_1.OrderStatus.READY_TO_SHIP,
                                awbNumber: awbNumber,
                                shippingDate: new Date(),
                            },
                        })];
                case 6:
                    updatedOrder = _s.sent();
                    // Download the label
                    // revalidatePath("/orders");
                    return [2 /*return*/, {
                            success: true,
                            order: (0, user_1.serializeDecimal)(updatedOrder),
                            awbNumber: awbNumber,
                        }];
                case 7:
                    errorMessage = (_r = (_q = (_p = response.data) === null || _p === void 0 ? void 0 : _p.data) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.message;
                    if ((errorMessage === null || errorMessage === void 0 ? void 0 : errorMessage.toLowerCase()) === "auto allocated hub not found") {
                        return [2 /*return*/, {
                                success: false,
                                error: "Pincode not serviceable"
                            }];
                    }
                    console.error(JSON.stringify({
                        message: "Failed to create DTDC order: ".concat(errorMessage),
                        path: "deliverypartner/dtdc",
                    }));
                    return [2 /*return*/, {
                            success: false,
                            error: "Failed to create DTDC order: ".concat(errorMessage || "Unknown error"),
                        }];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_1 = _s.sent();
                    console.error(JSON.stringify({
                        message: "Error in createDtdcOrder:",
                        errorDetails: error_1,
                        path: "deliverypartner/dtdc",
                    }));
                    return [2 /*return*/, {
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : "An unknown error occurred",
                        }];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function cancelDtdcOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var token, requestBody, response, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    console.log("awbNumber:", awbNumber);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("dtdc")];
                case 1:
                    token = _c.sent();
                    console.log("The cancel Dtdc is triggered, the token ", token);
                    requestBody = {
                        AWBNo: [awbNumber],
                        customerCode: "GL4949",
                    };
                    return [4 /*yield*/, axios_1.default.post("http://dtdcapi.shipsy.io/api/customer/integration/consignment/cancel", requestBody, {
                            headers: {
                                "api-key": "".concat(token),
                                "Content-Type": "application/json",
                            },
                        })];
                case 2:
                    response = _c.sent();
                    console.log(JSON.stringify({
                        message: "Cancellation Response:",
                        error: (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error[0],
                        path: "deliverypartner/dtdc",
                    }));
                    if (response.data.success === true ||
                        response.data.failures[0].current_status == "cancelled") {
                        // Update the ShipmentDetails table
                        console.log("Order with AWB number ".concat(awbNumber, " has been successfully cancelled."));
                        return [2 /*return*/, { success: true, message: "Order cancelled successfully" }];
                    }
                    else {
                        // console.error("Failed to cancel order:", response.data.status);
                        return [2 /*return*/, { success: false, message: "Order cancellation unsuccessful" }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _c.sent();
                    console.error(JSON.stringify({
                        message: "Error cancelling order:",
                        errorDetails: error_2,
                        path: "deliverypartner/dtdc",
                    }));
                    return [2 /*return*/, error_2];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function dtdcServiceable(originpin, destinationpin) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); });
}
