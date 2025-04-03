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
exports.createSmartrOrder = createSmartrOrder;
exports.cancelSmartrOrder = cancelSmartrOrder;
exports.downloadSmartrLabel = downloadSmartrLabel;
var axios_1 = require("axios");
// import { revalidatePath } from "next/cache";
// import { getDeliveryPartnerId } from "../orders"
var tokenManager_1 = require("./tokenManager");
var prisma_1 = require("../../lib/prisma");
var client_1 = require("@prisma/client");
function createSmartrOrder(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var responseOrderId, order, token, warehouseAddress, customerAddress, collectableValue, requestBody, response, awbNumber, updatedOrder;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("Inside Smartr");
                    responseOrderId = orderId + Math.floor(100 + Math.random() * 900).toString();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { id: orderId },
                            include: {
                                customerAddress: true,
                                Packages: true,
                            },
                        })];
                case 1:
                    order = _d.sent();
                    if (!order) {
                        console.error("Order not found");
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("smartr")];
                case 2:
                    token = _d.sent();
                    return [4 /*yield*/, prisma_1.default.address.findFirst({
                            where: {
                                id: order.agentAddressId || undefined,
                            },
                        })];
                case 3:
                    warehouseAddress = _d.sent();
                    if (!warehouseAddress) {
                        console.error("Warehouse address not found");
                        return [2 /*return*/, { success: false, error: "Warehouse address not found" }];
                    }
                    customerAddress = order.customerAddress;
                    if (!customerAddress) {
                        console.error("Customer address not found");
                        return [2 /*return*/, { success: false, error: "Customer address not found" }];
                    }
                    collectableValue = ((_a = order.paymentMode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "prepaid" ? 0 : order.totalOrderValue;
                    requestBody = [
                        {
                            packageDetails: {
                                awbNumber: "",
                                orderNumber: responseOrderId,
                                productType: ((_b = order.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "prepaid" ? "ACP" : "ACC",
                                collectableValue: collectableValue,
                                itemDesc: order.Packages.map(function (item) { return item.productName; }).join(", "),
                                declaredValue: (_c = order.totalOrderValue) === null || _c === void 0 ? void 0 : _c.toString(),
                                dimensions: "".concat(order.length || 0, "~").concat(order.breadth || 0, "~").concat(order.height || 0, "~1~").concat(order.deadWeight || 0, "~0/"),
                                pieces: "1",
                                weight: order.applicableWeight,
                                invoiceNumber: "34543",
                                qty: order.Packages.length.toString(),
                            },
                            deliveryDetails: {
                                toName: customerAddress.fullName,
                                toAdd: customerAddress.address,
                                toCity: customerAddress.city,
                                toState: customerAddress.state,
                                toPin: customerAddress.pincode.toString(),
                                toMobile: customerAddress.contactNumber,
                                toAddType: "Home",
                                toLat: "0.0",
                                toLng: "0.0",
                                toEmail: customerAddress.email,
                            },
                            pickupDetails: {
                                fromName: warehouseAddress.personName,
                                fromAdd: warehouseAddress.address,
                                fromCity: warehouseAddress.city,
                                fromState: warehouseAddress.state,
                                fromPin: warehouseAddress.pincode.toString(),
                                fromMobile: warehouseAddress.contactNumber,
                                fromAddType: "Seller",
                                fromLat: "0.0",
                                fromLng: "0.0",
                                fromEmail: warehouseAddress.email,
                            },
                            returnDetails: {
                                rtoName: warehouseAddress.personName,
                                rtoAdd: warehouseAddress.address,
                                rtoCity: warehouseAddress.city,
                                rtoState: warehouseAddress.state,
                                rtoPin: warehouseAddress.pincode.toString(),
                                rtoMobile: warehouseAddress.contactNumber,
                                rtoAddType: "Seller",
                                rtoLat: "0.0",
                                rtoLng: "0.00",
                                rtoEmail: warehouseAddress.email,
                            },
                            additionalInformation: {
                                BLUDDART_AIR_CUSTOMER_CODE: "ABICS5822N",
                                essentialFlag: "",
                                otpFlag: "",
                                dgFlag: "",
                                isSurface: "false",
                                isReverse: "false",
                                sellerGSTIN: "06GSTIN678YUIOIN",
                                sellerERN: "",
                            },
                        },
                    ];
                    return [4 /*yield*/, axios_1.default.post("https://api.smartr.in/api/v1/add-order/", requestBody, {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                                "Content-Type": "application/json",
                                Cookie: "csrftoken=38d9eQOFJxf031Ur2c6a6sqME64mEqsfB20rBsHDkDPGLhyasgFCd9JPLChMhiL1; sessionid=u787x2cfam7yj3fvjco1sbewmw800rys",
                            },
                        })];
                case 4:
                    response = _d.sent();
                    console.log("API Response:", response.data);
                    if (!(response.data.total_success && response.data.total_success.length > 0)) return [3 /*break*/, 6];
                    console.log("Order creation successful");
                    awbNumber = response.data.total_success[0].awbNumber;
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { id: order.orderId },
                            data: {
                                status: client_1.OrderStatus.READY_TO_SHIP,
                                awbNumber: awbNumber,
                            },
                        })];
                case 5:
                    updatedOrder = _d.sent();
                    console.log("Order updated with AWB number:", updatedOrder);
                    // revalidatePath("/orders");
                    return [2 /*return*/, updatedOrder];
                case 6:
                    // toast.error(`Failed to ship order ${response.data.total_failure[0].error}`)
                    console.error("Reason: ".concat(response.data.total_failure[0].error));
                    _d.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
function cancelSmartrOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var token, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    console.log("awbNumber:", awbNumber);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("smartr")];
                case 1:
                    token = _a.sent();
                    console.log("The cancelSmartOrder is triggered, the token ", token);
                    return [4 /*yield*/, axios_1.default.post("https://api.smartr.in/api/v1/updateCancel/", {
                            awbs: [awbNumber],
                        }, {
                            headers: {
                                " Authorization": "Bearer ".concat(token),
                                "Content-Type": "application/json",
                                Cookie: "csrftoken=38d9eQOFJxf031Ur2c6a6sqME64mEqsfB20rBsHDkDPGLhyasgFCd9JPLChMhiL1; sessionid=u787x2cfam7yj3fvjco1sbewmw800rys",
                            },
                        })];
                case 2:
                    response = _a.sent();
                    console.log("Cancellation Response:", response.data.data[0].awb);
                    if (!(response.status === 200)) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { awbNumber: awbNumber },
                            data: {
                                status: client_1.OrderStatus.NEW,
                                awbNumber: null,
                                deliveryPartner: null,
                            },
                        })];
                case 3:
                    _a.sent();
                    console.log("Order with AWB number ".concat(awbNumber, " has been successfully cancelled."));
                    // revalidatePath(`/orders`);
                    return [2 /*return*/, { success: true, message: "Order cancelled successfully" }];
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error("Error cancelling order:", error_1);
                    return [2 /*return*/, error_1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function downloadSmartrLabel(awbNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var token, response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("smartr")];
                case 1:
                    token = _a.sent();
                    console.log("AWB number ", awbNumber);
                    return [4 /*yield*/, axios_1.default.get("https://api.smartr.in/api/v1/generateLabel/?awbs=".concat(awbNumber), {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                                Cookie: "csrftoken=38d9eQOFJxf031Ur2c6a6sqME64mEqsfB20rBsHDkDPGLhyasgFCd9JPLChMhiL1; sessionid=u787x2cfam7yj3fvjco1sbewmw800rys",
                            },
                        })];
                case 2:
                    response = _a.sent();
                    if (response.data.success) {
                        // console.log("Label URL:", response.data.labelUrl);
                        return [2 /*return*/, { success: true }];
                    }
                    else {
                        console.error("Failed to generate label:", response.data.error);
                        return [2 /*return*/, { success: false }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("Error downloading label:", error_2);
                    return [2 /*return*/, { success: false }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
