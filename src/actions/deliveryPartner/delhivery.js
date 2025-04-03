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
exports.cancelDelhiveryOrder = cancelDelhiveryOrder;
exports.createDelhiveryOrder = createDelhiveryOrder;
exports.createDelhiveryReverseOrder = createDelhiveryReverseOrder;
exports.createDelhiveryNdr = createDelhiveryNdr;
var axios_1 = require("axios");
var client_1 = require("@prisma/client");
// import DeliveryPartnerModal from "@/components/UserAdmin/testing/DeliveryPartnerModal";
var tokenManager_1 = require("./tokenManager");
var prisma_1 = require("../../lib/prisma");
var token;
function getToken(type) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Getting token for type:", type);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 16, , 17]);
                    _a = type.toLowerCase();
                    switch (_a) {
                        case "delhivery": return [3 /*break*/, 2];
                        case "delhivery 5kg": return [3 /*break*/, 4];
                        case "delhivery 10kg": return [3 /*break*/, 6];
                        case "delhivery 20kg": return [3 /*break*/, 8];
                        case "delhivery air": return [3 /*break*/, 10];
                        case "delhivery reverse": return [3 /*break*/, 12];
                    }
                    return [3 /*break*/, 14];
                case 2: return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery")];
                case 3:
                    token = _b.sent();
                    return [3 /*break*/, 15];
                case 4: return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery5kg")];
                case 5:
                    token = _b.sent();
                    return [3 /*break*/, 15];
                case 6: return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery10kg")];
                case 7:
                    token = _b.sent();
                    return [3 /*break*/, 15];
                case 8: return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery20kg")];
                case 9:
                    token = _b.sent();
                    return [3 /*break*/, 15];
                case 10: return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("DelhiveryAir")];
                case 11:
                    token = _b.sent();
                    return [3 /*break*/, 15];
                case 12: return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery")];
                case 13:
                    token = _b.sent();
                    return [3 /*break*/, 15];
                case 14:
                    console.error("No token found for type: ".concat(type, " "));
                    _b.label = 15;
                case 15:
                    if (!token) {
                        console.error("Token is undefined for type: ".concat(type));
                    }
                    console.log("Token successfully retrieved:", token.substring(0, 10) + "...");
                    return [2 /*return*/, token];
                case 16:
                    error_1 = _b.sent();
                    console.error("Error in getToken:", error_1);
                    return [2 /*return*/, error_1 instanceof Error ? error_1.message : String(error_1)];
                case 17: return [2 /*return*/];
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
function cancelDelhiveryOrder(awbNumber, type) {
    return __awaiter(this, void 0, void 0, function () {
        var token_1, data, jsonData, requestBody, response, order, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    console.log("awbNumber line no. 232:", awbNumber);
                    return [4 /*yield*/, getToken(type)];
                case 1:
                    token_1 = _a.sent();
                    data = {
                        waybill: awbNumber,
                        cancellation: true,
                    };
                    jsonData = JSON.stringify(data);
                    requestBody = jsonData;
                    return [4 /*yield*/, axios_1.default.post("https://track.delhivery.com/api/p/edit", requestBody, {
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                                Authorization: "Token ".concat(token_1),
                            },
                        })];
                case 2:
                    response = _a.sent();
                    console.log("Cancellation Response from Delhivery line 254:", response.data);
                    if (!(response.data.status === true)) return [3 /*break*/, 4];
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
                    // revalidateTag('orders');
                    return [2 /*return*/, { success: true, message: "Order cancelled successfully" }];
                case 4:
                    console.error("Failed to cancel order:", response.status);
                    return [2 /*return*/, { success: false, message: "Order cancellation unsuccessfully" }];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.error("Error cancelling order:", error_2);
                    return [2 /*return*/, {
                            success: false,
                            message: "An unexpected error occurred. Please try again.",
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function createDelhiveryOrder(orderId, mode, type) {
    return __awaiter(this, void 0, void 0, function () {
        var token_2, order, warehouseAddress, rtoWarehouseAddress, warehouseDetails, warehouseResponse, warehouseError_1, shipmentData, jsonData, requestBody, response, awbNumber, updatedOrder, error_3;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
        return __generator(this, function (_8) {
            switch (_8.label) {
                case 0:
                    _8.trys.push([0, 15, , 16]);
                    console.log("Starting createDelhiveryOrder for orderId:", orderId);
                    return [4 /*yield*/, getToken(type)];
                case 1:
                    token_2 = _8.sent();
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
                    order = _8.sent();
                    if (!order) {
                        console.error("Order not found for orderId: ".concat(orderId));
                        return [2 /*return*/, { success: false, message: "Order not found" }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findUnique({
                            where: { id: (_a = order.agentAddressId) !== null && _a !== void 0 ? _a : undefined },
                        })];
                case 3:
                    warehouseAddress = _8.sent();
                    return [4 /*yield*/, prisma_1.default.address.findUnique({
                            where: { id: (_b = order.rtoAgentAddressId) !== null && _b !== void 0 ? _b : undefined },
                        })];
                case 4:
                    rtoWarehouseAddress = _8.sent();
                    if (!warehouseAddress || !rtoWarehouseAddress) {
                        console.error("Warehouse address or RTO warehouse address not found");
                        return [2 /*return*/, { success: false, message: "Warehouse address not found" }];
                    }
                    warehouseDetails = {
                        name: warehouseAddress.tag,
                        email: warehouseAddress.email || "default@example.com",
                        phone: warehouseAddress.contactNumber,
                        address: warehouseAddress.address,
                        city: warehouseAddress.city,
                        country: "India",
                        pin: warehouseAddress.pincode.toString(),
                        return_address: rtoWarehouseAddress.address,
                        return_pin: rtoWarehouseAddress.pincode.toString(),
                        return_city: rtoWarehouseAddress.city,
                        return_state: rtoWarehouseAddress.state,
                        return_country: "India",
                    };
                    _8.label = 5;
                case 5:
                    _8.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, axios_1.default.post("https://track.delhivery.com/api/backend/clientwarehouse/create/", warehouseDetails, {
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                                Authorization: "Token ".concat(token_2),
                            },
                        })];
                case 6:
                    warehouseResponse = _8.sent();
                    if (warehouseResponse.data.success) {
                        console.log("Warehouse creation successful");
                    }
                    else {
                        if (warehouseResponse.data.error &&
                            ((_c = warehouseResponse.data.error[0]) === null || _c === void 0 ? void 0 : _c.includes("already exists"))) {
                            console.log("Warehouse already exists");
                        }
                        else {
                            console.error("Failed to create warehouse:", warehouseResponse.data.error);
                        }
                    }
                    return [3 /*break*/, 8];
                case 7:
                    warehouseError_1 = _8.sent();
                    console.warn("Warehouse creation failed, proceeding with existing warehouse:", warehouseError_1);
                    return [3 /*break*/, 8];
                case 8:
                    shipmentData = {
                        shipments: [
                            {
                                name: (_e = (_d = order.customerAddress) === null || _d === void 0 ? void 0 : _d.fullName) !== null && _e !== void 0 ? _e : "",
                                add: (_g = (_f = order.customerAddress) === null || _f === void 0 ? void 0 : _f.address) !== null && _g !== void 0 ? _g : "",
                                pin: (_k = (_j = (_h = order.customerAddress) === null || _h === void 0 ? void 0 : _h.pincode) === null || _j === void 0 ? void 0 : _j.toString()) !== null && _k !== void 0 ? _k : "",
                                city: (_m = (_l = order.customerAddress) === null || _l === void 0 ? void 0 : _l.city) !== null && _m !== void 0 ? _m : "",
                                state: (_p = (_o = order.customerAddress) === null || _o === void 0 ? void 0 : _o.state) !== null && _p !== void 0 ? _p : "",
                                country: "India",
                                phone: (_r = (_q = order.customerAddress) === null || _q === void 0 ? void 0 : _q.contactNumber) !== null && _r !== void 0 ? _r : "",
                                order: generateRandomOrderId(order.orderId),
                                payment_mode: ((_s = order.paymentMode) === null || _s === void 0 ? void 0 : _s.toUpperCase()) || "",
                                return_pin: (_u = (_t = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.pincode) === null || _t === void 0 ? void 0 : _t.toString()) !== null && _u !== void 0 ? _u : "",
                                return_city: (_v = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.city) !== null && _v !== void 0 ? _v : "",
                                return_phone: (_w = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.contactNumber) !== null && _w !== void 0 ? _w : "",
                                return_add: (_x = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.address) !== null && _x !== void 0 ? _x : "",
                                return_state: (_y = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.state) !== null && _y !== void 0 ? _y : "",
                                return_country: "India",
                                products_desc: "",
                                cod_amount: ((_z = order.paymentMode) === null || _z === void 0 ? void 0 : _z.toLowerCase()) === "cod"
                                    ? (_1 = (_0 = order.totalOrderValue) === null || _0 === void 0 ? void 0 : _0.toString()) !== null && _1 !== void 0 ? _1 : "0"
                                    : "0",
                                total_amount: (_3 = (_2 = order.totalOrderValue) === null || _2 === void 0 ? void 0 : _2.toString()) !== null && _3 !== void 0 ? _3 : "0",
                                seller_add: warehouseAddress.address,
                                seller_name: ((_4 = order === null || order === void 0 ? void 0 : order.Users) === null || _4 === void 0 ? void 0 : _4.StoreName) || warehouseAddress.tag,
                                shipment_width: ((_5 = order.breadth) === null || _5 === void 0 ? void 0 : _5.toString()) || "",
                                shipment_height: ((_6 = order.height) === null || _6 === void 0 ? void 0 : _6.toString()) || "",
                                weight: ((_7 = order.applicableWeight) === null || _7 === void 0 ? void 0 : _7.toString()) || "",
                                shipping_mode: mode === "surface" ? "Surface" : "Express",
                            },
                        ],
                        pickup_location: {
                            name: warehouseAddress.tag,
                            add: warehouseAddress.address,
                            city: warehouseAddress.city,
                            pin_code: warehouseAddress.pincode,
                            country: "India",
                            phone: warehouseAddress.contactNumber,
                        },
                    };
                    console.log(shipmentData);
                    jsonData = JSON.stringify(shipmentData);
                    requestBody = "format=json&data=".concat(encodeURIComponent(jsonData));
                    return [4 /*yield*/, axios_1.default.post("https://track.delhivery.com/api/cmu/create.json", requestBody, {
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                                Accept: "application/json",
                                Authorization: "Token ".concat(token_2),
                            },
                        })];
                case 9:
                    response = _8.sent();
                    console.log(JSON.stringify(requestBody), "requestBody for delhivery");
                    console.log(JSON.stringify({
                        message: "Delhivery API response:",
                        responseData: response.data,
                        path: "deliveryPartners/delhivery.js",
                    }, null, 2));
                    if (!(response.data && response.data.packages && response.data.packages[0])) return [3 /*break*/, 13];
                    if (!(response.data.packages[0].status !== "Fail")) return [3 /*break*/, 11];
                    awbNumber = response.data.packages[0].waybill;
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { id: orderId },
                            data: {
                                status: client_1.OrderStatus.READY_TO_SHIP,
                                awbNumber: awbNumber,
                            },
                        })];
                case 10:
                    updatedOrder = _8.sent();
                    return [2 /*return*/, { success: true, awbNumber: awbNumber }];
                case 11:
                    if (response.data.packages[0].serviceable === false) {
                        console.error("Pincode is not serviceable");
                        return [2 /*return*/, { success: false, message: "Pincode is not serviceable" }];
                    }
                    else if (response.data.packages[0].sort_code === "BAN/EEN") {
                        console.error(":Warehouse is banned, choose a different warehouse to proceed");
                        return [2 /*return*/, {
                                success: false,
                                error: ":Warehouse is banned, choose a different warehouse to proceed",
                            }];
                    }
                    else {
                        console.error(JSON.stringify({
                            message: "Failed to create Delhivery order: ".concat(response.data.packages[0].status),
                            path: "deliveryPartners/delhivery.js",
                        }));
                        return [2 /*return*/, {
                                success: false,
                                message: "Failed to create Delhivery order",
                            }];
                    }
                    _8.label = 12;
                case 12: return [3 /*break*/, 14];
                case 13:
                    console.error("Unexpected response format from Delhivery API");
                    return [2 /*return*/, {
                            success: false,
                            message: "Unexpected response format from Delhivery API",
                        }];
                case 14: return [3 /*break*/, 16];
                case 15:
                    error_3 = _8.sent();
                    console.error(JSON.stringify({
                        message: "Error creating Delhivery shipment:",
                        errorDetails: error_3,
                        path: "deliveryPartners/delhivery.js",
                    }));
                    if (error_3 instanceof Error) {
                        return [2 /*return*/, { success: false, error: error_3.message }];
                    }
                    else {
                        return [2 /*return*/, { success: false, error: "An unknown error occurred" }];
                    }
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
function createDelhiveryReverseOrder(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var token_3, order_1, reverseCustomerAddress, reversePickupAddress, warehouseDetails, warehouseResponse, warehouseError_2, shipmentData, jsonData, requestBody, response, awbNumber_1, updatedOrder, safeToNumber, remarks, error_4, remarks;
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        return __generator(this, function (_s) {
            switch (_s.label) {
                case 0:
                    _s.trys.push([0, 11, , 12]);
                    console.log("Starting createDelhiveryReverseOrder for orderId:", orderId);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery")];
                case 1:
                    token_3 = _s.sent();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { id: orderId },
                            include: {
                                reverseCustomerAddress: true,
                                ReversePickupAddress: true,
                                Users: true,
                            },
                        })];
                case 2:
                    order_1 = _s.sent();
                    if (!order_1) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Order not found for orderId: ".concat(orderId),
                            }];
                    }
                    console.log("Order details:", JSON.stringify(order_1, null, 2));
                    reverseCustomerAddress = order_1.reverseCustomerAddress;
                    reversePickupAddress = order_1.ReversePickupAddress;
                    if (!reversePickupAddress || !reverseCustomerAddress) {
                        return [2 /*return*/, {
                                success: false,
                                error: "ReversePickupAddress or reverseCustomerAddress not found",
                            }];
                    }
                    warehouseDetails = {
                        name: reverseCustomerAddress.tag,
                        email: reverseCustomerAddress.email || "default@example.com",
                        phone: reverseCustomerAddress.contactNumber,
                        address: reverseCustomerAddress.address,
                        city: reverseCustomerAddress.city,
                        country: "India",
                        pin: reverseCustomerAddress.pincode.toString(),
                        return_address: reversePickupAddress.address,
                        return_pin: reversePickupAddress.pincode.toString(),
                        return_city: reversePickupAddress.city,
                        return_state: reversePickupAddress.state,
                        return_country: "India",
                    };
                    _s.label = 3;
                case 3:
                    _s.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, axios_1.default.post("https://track.delhivery.com/api/backend/clientwarehouse/create/", warehouseDetails, {
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                                Authorization: "Token ".concat(token_3),
                            },
                        })];
                case 4:
                    warehouseResponse = _s.sent();
                    if (warehouseResponse.data.success) {
                        console.log("Warehouse creation successful");
                    }
                    else {
                        if (warehouseResponse.data.error &&
                            ((_a = warehouseResponse.data.error[0]) === null || _a === void 0 ? void 0 : _a.includes("already exists"))) {
                            console.log("Warehouse already exists");
                        }
                        else {
                            console.error("Failed to create warehouse:", warehouseResponse.data.error);
                        }
                    }
                    return [3 /*break*/, 6];
                case 5:
                    warehouseError_2 = _s.sent();
                    console.warn("Warehouse creation failed, proceeding with existing warehouse:", warehouseError_2);
                    return [3 /*break*/, 6];
                case 6:
                    shipmentData = {
                        shipments: [
                            {
                                name: reversePickupAddress.fullName,
                                add: reversePickupAddress.address,
                                pin: reversePickupAddress.pincode.toString(),
                                city: reversePickupAddress.city,
                                state: reversePickupAddress.state,
                                country: "India",
                                phone: reversePickupAddress.contactNumber,
                                order: generateRandomOrderId(order_1.orderId),
                                payment_mode: "Pickup",
                                return_pin: reverseCustomerAddress.pincode.toString(),
                                return_city: reverseCustomerAddress.city,
                                return_phone: reverseCustomerAddress.contactNumber,
                                return_add: reverseCustomerAddress.address,
                                return_state: reverseCustomerAddress.state,
                                return_country: "India",
                                cod_amount: ((_b = order_1.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "cod"
                                    ? (_d = (_c = order_1.totalOrderValue) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : "0"
                                    : "0",
                                total_amount: (_f = (_e = order_1.totalOrderValue) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : "0",
                                shipment_width: ((_g = order_1.breadth) === null || _g === void 0 ? void 0 : _g.toString()) || "",
                                shipment_height: ((_h = order_1.height) === null || _h === void 0 ? void 0 : _h.toString()) || "",
                                weight: ((_j = order_1.applicableWeight) === null || _j === void 0 ? void 0 : _j.toString()) || "",
                                shipping_mode: order_1.shippingMode || "Surface",
                            },
                        ],
                        pickup_location: {
                            name: reverseCustomerAddress.tag,
                            add: reverseCustomerAddress.address,
                            city: reverseCustomerAddress.city,
                            pin_code: reverseCustomerAddress.pincode,
                            country: "India",
                            phone: reverseCustomerAddress.contactNumber,
                        },
                    };
                    jsonData = JSON.stringify(shipmentData);
                    requestBody = "format=json&data=".concat(encodeURIComponent(jsonData));
                    return [4 /*yield*/, axios_1.default.post("https://track.delhivery.com/api/cmu/create.json", requestBody, {
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                                Accept: "application/json",
                                Authorization: "Token ".concat(token_3),
                            },
                        })];
                case 7:
                    response = _s.sent();
                    console.log(JSON.stringify({
                        data: "Delhivery API response:",
                        responseData: response.data,
                        path: "deliveryPartner/delhivery",
                    }));
                    if (!(response.data.success &&
                        response.data.packages &&
                        ((_k = response.data.packages[0]) === null || _k === void 0 ? void 0 : _k.status) !== "Fail")) return [3 /*break*/, 9];
                    awbNumber_1 = response.data.packages[0].waybill;
                    return [4 /*yield*/, prisma_1.default.$transaction(function (prisma) { return __awaiter(_this, void 0, void 0, function () {
                            var updatedOrder;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.orders.update({
                                            where: { id: order_1.id },
                                            data: {
                                                status: client_1.OrderStatus.READY_TO_SHIP,
                                                awbNumber: awbNumber_1,
                                            },
                                        })];
                                    case 1:
                                        updatedOrder = _a.sent();
                                        return [2 /*return*/, updatedOrder];
                                }
                            });
                        }); })];
                case 8:
                    updatedOrder = _s.sent();
                    safeToNumber = function (value) {
                        return value ? value.toNumber() : null;
                    };
                    return [2 /*return*/, {
                            success: true,
                            order: __assign(__assign({}, updatedOrder), { deadWeight: safeToNumber(updatedOrder.deadWeight), breadth: safeToNumber(updatedOrder.breadth), height: safeToNumber(updatedOrder.height), length: safeToNumber(updatedOrder.length), applicableWeight: safeToNumber(updatedOrder.applicableWeight), totalOrderValue: safeToNumber(updatedOrder.totalOrderValue) }),
                            awbNumber: awbNumber_1,
                        }];
                case 9:
                    remarks = ((_m = (_l = response.data.packages) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.remarks) || JSON.stringify(response.data);
                    return [2 /*return*/, {
                            success: false,
                            error: remarks,
                            details: response.data,
                        }];
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_4 = _s.sent();
                    console.error(JSON.stringify({
                        data: "Error in createDelhiveryReverseOrder:",
                        error: error_4,
                        path: "deliveryPartner/delhivery",
                    }));
                    // If it's an API error response containing the remarks
                    if (axios_1.default.isAxiosError(error_4) &&
                        ((_r = (_q = (_p = (_o = error_4.response) === null || _o === void 0 ? void 0 : _o.data) === null || _p === void 0 ? void 0 : _p.packages) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.remarks)) {
                        remarks = error_4.response.data.packages[0].remarks;
                        return [2 /*return*/, { success: false, error: remarks }];
                    }
                    // Default error handling
                    if (error_4 instanceof Error) {
                        return [2 /*return*/, { success: false, error: error_4.message }];
                    }
                    return [2 /*return*/, {
                            success: false,
                            error: "An unexpected error occurred while creating Delhivery reverse order",
                        }];
                case 12: return [2 /*return*/];
            }
        });
    });
}
function createDelhiveryNdr(order, data, type) {
    return __awaiter(this, void 0, void 0, function () {
        var token_4, orders, isReAttemptOnly, editResult, reattemptResult, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting createDelhiveryNdr for order:", order);
                    console.log("Data:", data);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, getToken(order.DeliveryPartner.partnerName)];
                case 2:
                    token_4 = _a.sent();
                    console.log("Token:", token_4);
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
                    isReAttemptOnly = JSON.stringify(data) === "{}";
                    if (!!isReAttemptOnly) return [3 /*break*/, 5];
                    return [4 /*yield*/, editShipmentDetails(orders, data, token_4)];
                case 4:
                    editResult = _a.sent();
                    if (!editResult.success) {
                        return [2 /*return*/, editResult];
                    }
                    _a.label = 5;
                case 5: return [4 /*yield*/, requestReAttempt(order.awbNumber, token_4)];
                case 6:
                    reattemptResult = _a.sent();
                    if (!reattemptResult.success) {
                        return [2 /*return*/, reattemptResult];
                    }
                    if (!(data.address || data.phone)) return [3 /*break*/, 8];
                    return [4 /*yield*/, updateCustomerAddressInDb(orders, data)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: return [2 /*return*/, { success: true, message: "NDR created successfully" }];
                case 9:
                    error_5 = _a.sent();
                    return [2 /*return*/, handleApiError(error_5, "createDelhiveryNdr")];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function editShipmentDetails(orders, data, token) {
    return __awaiter(this, void 0, void 0, function () {
        var requestBody, editResponse, error_6;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("Starting editShipmentDetails for order:", orders);
                    requestBody = {
                        waybill: orders.awbNumber,
                        phone: (data === null || data === void 0 ? void 0 : data.phone) || "",
                        name: "",
                        add: (data === null || data === void 0 ? void 0 : data.address) || "",
                        product_details: "",
                        shipment_length: parseFloat(((orders === null || orders === void 0 ? void 0 : orders.length) || 0).toFixed(1)) + 0.1,
                        shipment_width: parseFloat(((orders === null || orders === void 0 ? void 0 : orders.breadth) || 0).toFixed(1)) + 0.1,
                        shipment_height: parseFloat(((orders === null || orders === void 0 ? void 0 : orders.height) || 0).toFixed(1)) + 0.1,
                        weight: parseFloat(((orders === null || orders === void 0 ? void 0 : orders.applicableWeight) || 0).toFixed(1)) + 0.0,
                    };
                    console.log("Request body for NDR edit:", requestBody);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.post("https://track.delhivery.com/api/p/edit", requestBody, {
                            headers: getRequestHeaders(token),
                        })];
                case 2:
                    editResponse = _d.sent();
                    console.log("NDR Edit Response from Delhivery:", editResponse.data);
                    console.log("NDR Response from Delhivery:", editResponse.data.status);
                    if (((_a = editResponse.data) === null || _a === void 0 ? void 0 : _a.status) == "Failure") {
                        return [2 /*return*/, {
                                success: false,
                                error: ((_b = editResponse.data) === null || _b === void 0 ? void 0 : _b.message) ||
                                    ((_c = editResponse.data) === null || _c === void 0 ? void 0 : _c.error) ||
                                    "Failed to edit shipment details",
                            }];
                    }
                    return [2 /*return*/, { success: true }];
                case 3:
                    error_6 = _d.sent();
                    return [2 /*return*/, handleApiError(error_6, "editShipmentDetails")];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function requestReAttempt(awbNumber, token) {
    return __awaiter(this, void 0, void 0, function () {
        var updateRequestBody, updateResponse, error_7;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    updateRequestBody = {
                        data: [
                            {
                                waybill: awbNumber,
                                act: "RE-ATTEMPT",
                            },
                        ],
                    };
                    console.log("Request body for NDR re-attempt:", updateRequestBody);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.post("https://track.delhivery.com/api/p/update", updateRequestBody, {
                            headers: getRequestHeaders(token),
                        })];
                case 2:
                    updateResponse = _d.sent();
                    console.log("Update response:", updateResponse.data);
                    if (((_a = updateResponse.data) === null || _a === void 0 ? void 0 : _a.request_id) && !updateResponse.data.error) {
                        return [2 /*return*/, { success: true }];
                    }
                    return [2 /*return*/, {
                            success: false,
                            error: ((_b = updateResponse.data) === null || _b === void 0 ? void 0 : _b.message) ||
                                ((_c = updateResponse.data) === null || _c === void 0 ? void 0 : _c.error) ||
                                "Failed to create NDR",
                        }];
                case 3:
                    error_7 = _d.sent();
                    return [2 /*return*/, handleApiError(error_7, "requestReAttempt")];
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
function getRequestHeaders(token) {
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token ".concat(token),
    };
}
function handleApiError(error, source) {
    var _a, _b, _c;
    if (axios_1.default.isAxiosError(error) && error.response) {
        console.error("Error in ".concat(source, ":"), {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
        });
        var errorMessage = ((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.message) ||
            ((_b = error.response.data) === null || _b === void 0 ? void 0 : _b.error) ||
            ((_c = error.response.data) === null || _c === void 0 ? void 0 : _c.detail) ||
            "Error from Delhivery API";
        return {
            success: false,
            error: "Delhivery API error: ".concat(errorMessage, " (").concat(error.response.status, ")"),
        };
    }
    if (error instanceof Error) {
        console.error("Error in ".concat(source, ":"), error);
        return { success: false, error: error.message };
    }
    console.error("Unexpected error in ".concat(source, ":"), error);
    return {
        success: false,
        error: "An unexpected error occurred in ".concat(source),
    };
}
