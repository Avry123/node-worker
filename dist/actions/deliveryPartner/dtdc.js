"use strict";
"use server";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDtdcOrder = createDtdcOrder;
exports.cancelDtdcOrder = cancelDtdcOrder;
exports.dtdcServiceable = dtdcServiceable;
const axios_1 = __importDefault(require("axios"));
const tokenManager_1 = require("./tokenManager");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const client_1 = require("@prisma/client");
const user_1 = require("../user");
function createDtdcOrder(orderId, mode) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("dtdc");
            const order = yield prisma_1.default.orders.findUnique({
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
            });
            if (!order) {
                console.error("Order not found");
                return { success: false, error: "Order not found" };
            }
            const weight = parseFloat(((_a = order.applicableWeight) === null || _a === void 0 ? void 0 : _a.toString()) || "0");
            if (weight > 100) {
                console.error("Package weight exceeds DTDC's limit of 100 kg. Please split the shipment or choose a different courier.");
            }
            const warehouseAddress = yield prisma_1.default.address.findFirst({
                where: {
                    id: order.agentAddressId || undefined,
                },
            });
            const rtoWarehouseAddress = yield prisma_1.default.address.findUnique({
                where: { id: (_b = order.rtoAgentAddressId) !== null && _b !== void 0 ? _b : undefined },
            });
            if (!warehouseAddress || !rtoWarehouseAddress) {
                console.error("Warehouse address or RTO warehouse address not found");
                return {
                    success: false,
                    error: "Warehouse address or RTO warehouse address not found",
                };
            }
            const customerAddress = order.customerAddress;
            if (!customerAddress) {
                console.error("Customer address not found");
                return { success: false, error: "Customer address not found" };
            }
            const requestBody = {
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
                        pieces_detail: order.Packages.map((item) => ({
                            description: item.productName,
                            declared_value: item.price,
                            weight: "0",
                            height: "0",
                            length: "0",
                            width: "0",
                        })),
                    },
                ],
            };
            const response = yield axios_1.default.post("https://dtdcapi.shipsy.io/api/customer/integration/consignment/softdata", requestBody, {
                headers: {
                    "api-key": `${token}`,
                    "Content-Type": "application/json",
                },
            });
            console.log("request body for dtdc", JSON.stringify(requestBody));
            if (((_m = (_l = (_k = response.data) === null || _k === void 0 ? void 0 : _k.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.success) === true) {
                const awbNumber = (_o = response.data) === null || _o === void 0 ? void 0 : _o.data[0].reference_number;
                const updatedOrder = yield prisma_1.default.orders.update({
                    where: { id: order.id },
                    data: {
                        status: client_1.OrderStatus.READY_TO_SHIP,
                        awbNumber: awbNumber,
                        shippingDate: new Date(),
                    },
                });
                // Download the label
                // revalidatePath("/orders");
                return {
                    success: true,
                    order: (0, user_1.serializeDecimal)(updatedOrder),
                    awbNumber: awbNumber,
                };
            }
            else {
                const errorMessage = (_r = (_q = (_p = response.data) === null || _p === void 0 ? void 0 : _p.data) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.message;
                if ((errorMessage === null || errorMessage === void 0 ? void 0 : errorMessage.toLowerCase()) === "auto allocated hub not found") {
                    return {
                        success: false,
                        error: "Pincode not serviceable"
                    };
                }
                console.error(JSON.stringify({
                    message: `Failed to create DTDC order: ${errorMessage}`,
                    path: "deliverypartner/dtdc",
                }));
                return {
                    success: false,
                    error: `Failed to create DTDC order: ${errorMessage || "Unknown error"}`,
                };
            }
        }
        catch (error) {
            console.error(JSON.stringify({
                message: "Error in createDtdcOrder:",
                errorDetails: error,
                path: "deliverypartner/dtdc",
            }));
            return {
                success: false,
                error: error instanceof Error ? error.message : "An unknown error occurred",
            };
        }
    });
}
function cancelDtdcOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            console.log("awbNumber:", awbNumber);
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("dtdc");
            console.log("The cancel Dtdc is triggered, the token ", token);
            const requestBody = {
                AWBNo: [awbNumber],
                customerCode: "GL4949",
            };
            const response = yield axios_1.default.post("http://dtdcapi.shipsy.io/api/customer/integration/consignment/cancel", requestBody, {
                headers: {
                    "api-key": `${token}`,
                    "Content-Type": "application/json",
                },
            });
            console.log(JSON.stringify({
                message: "Cancellation Response:",
                error: (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error[0],
                path: "deliverypartner/dtdc",
            }));
            if (response.data.success === true ||
                response.data.failures[0].current_status == "cancelled") {
                // Update the ShipmentDetails table
                console.log(`Order with AWB number ${awbNumber} has been successfully cancelled.`);
                return { success: true, message: "Order cancelled successfully" };
            }
            else {
                // console.error("Failed to cancel order:", response.data.status);
                return { success: false, message: "Order cancellation unsuccessful" };
            }
        }
        catch (error) {
            console.error(JSON.stringify({
                message: "Error cancelling order:",
                errorDetails: error,
                path: "deliverypartner/dtdc",
            }));
            return error;
        }
    });
}
function dtdcServiceable(originpin, destinationpin) {
    return __awaiter(this, void 0, void 0, function* () { });
}
