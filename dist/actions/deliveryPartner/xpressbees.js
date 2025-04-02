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
exports.createXpressbeesOrder = createXpressbeesOrder;
exports.cancelXpressbeesOrder = cancelXpressbeesOrder;
exports.createXpressbeesNdr = createXpressbeesNdr;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
// import { revalidatePath } from "next/cache";
// import { getDeliveryPartnerId } from "../orders";
const tokenManager_1 = require("./tokenManager");
const prisma_1 = __importDefault(require("../../lib/prisma"));
function createXpressbeesOrder(orderId, id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("xpressbees");
            const reference_id = orderId + Math.floor(Math.random() * 1000).toString();
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
            const warehouseAddress = yield prisma_1.default.address.findFirst({
                where: {
                    id: order.agentAddressId || undefined,
                },
            });
            const rtoWarehouseAddress = yield prisma_1.default.address.findUnique({
                where: { id: (_a = order.rtoAgentAddressId) !== null && _a !== void 0 ? _a : undefined },
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
            const collectableAmount = ((_b = order.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "prepaid"
                ? 0
                : order.totalOrderValue;
            const requestBody = {
                order_number: reference_id,
                payment_type: (_c = order.paymentMode) === null || _c === void 0 ? void 0 : _c.toLowerCase(),
                order_amount: order.totalOrderValue,
                package_weight: order.applicableWeight
                    ? Math.round(order.applicableWeight.toNumber())
                    : 0,
                package_length: (_d = order.length) === null || _d === void 0 ? void 0 : _d.toString(),
                package_breadth: (_e = order.breadth) === null || _e === void 0 ? void 0 : _e.toString(),
                package_height: (_f = order.height) === null || _f === void 0 ? void 0 : _f.toString(),
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
                    name: ((_g = order === null || order === void 0 ? void 0 : order.Users) === null || _g === void 0 ? void 0 : _g.StoreName) || warehouseAddress.tag,
                    address: warehouseAddress.address,
                    address_2: warehouseAddress.landmark == " " ? "null" : warehouseAddress.landmark,
                    city: warehouseAddress.city,
                    state: warehouseAddress.state,
                    pincode: warehouseAddress.pincode.toString(),
                    phone: warehouseAddress.contactNumber,
                },
                order_items: order.Packages.map((item) => ({
                    name: item.productName,
                    qty: item.quantity,
                    price: parseFloat(item.price),
                })),
                courier_id: id,
                collectable_amount: collectableAmount,
            };
            try {
                const response = yield axios_1.default.post("https://shipment.xpressbees.com/api/shipments2", requestBody, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                console.log(JSON.stringify(requestBody), "requestBody for xpressbees");
                if (response.status === 200 && response.data.data.awb_number) {
                    const result = yield prisma_1.default.$transaction((prismaTransaction) => __awaiter(this, void 0, void 0, function* () {
                        const updatedOrder = yield prismaTransaction.orders.update({
                            where: { id: order.id },
                            data: {
                                status: client_1.OrderStatus.READY_TO_SHIP,
                                awbNumber: response.data.data.awb_number,
                                shippingDate: new Date(),
                            },
                        });
                        return updatedOrder;
                    }));
                    // revalidatePath("/orders");
                    const safeToNumber = (value) => {
                        return value ? value.toNumber() : null;
                    };
                    return {
                        success: true,
                        order: Object.assign(Object.assign({}, result), { deadWeight: safeToNumber(result.deadWeight), breadth: safeToNumber(result.breadth), height: safeToNumber(result.height), length: safeToNumber(result.length), applicableWeight: safeToNumber(result.applicableWeight), totalOrderValue: safeToNumber(result.totalOrderValue) }),
                        awbNumber: response.data.data.awb_number,
                    };
                }
                else {
                    JSON.stringify({
                        data: "Failed to create order with Xpressbees",
                        error: response.data.data,
                        path: "deliveryPartner/xpressbees",
                    });
                }
            }
            catch (axiosError) {
                if (axiosError.response) {
                    const errorMessage = axiosError.response.data.message || "Pincode not serviceable";
                    return {
                        success: false,
                        error: errorMessage,
                    };
                }
                else if (axiosError.request) {
                    return {
                        success: false,
                        error: "No response received from Xpressbees",
                    };
                }
                else {
                    return {
                        success: false,
                        error: axiosError.message,
                    };
                }
            }
        }
        catch (error) {
            JSON.stringify({
                data: "Error in createXpressbeesOrder:",
                errorDetails: error,
                path: "deliveryPartner/xpressbees",
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : "An unknown error occurred",
            };
        }
    });
}
function cancelXpressbeesOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("xpressbees");
            const response = yield axios_1.default.post("https://shipment.xpressbees.com/api/shipments2/cancel", {
                awb: awbNumber,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
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
                return { success: true, message: response.data.message };
            }
            else {
                console.error(JSON.stringify({
                    data: "Failed to cancel Xpressbees order:",
                    errorDetails: response.data,
                    path: "deliveryPartner/xpressbees",
                }));
                return {
                    success: false,
                    message: response.data.message || "Unable to cancel order",
                };
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                // Handle 404 with specific response body
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404 &&
                    ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.status) === false &&
                    ((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) === "Unable to cancel") {
                    console.log(JSON.stringify({
                        data: "Xpressbees order cancellation handled successfully (404 case):",
                        responseDetails: (_f = error.response) === null || _f === void 0 ? void 0 : _f.data,
                        path: "deliveryPartner/xpressbees",
                    }));
                    return {
                        success: true,
                        message: ((_h = (_g = error.response) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.message) || "Order cancellation processed",
                    };
                }
                // Log other Axios errors
                console.error(JSON.stringify({
                    errorDetails: ((_j = error.response) === null || _j === void 0 ? void 0 : _j.data) || error.message,
                    path: "deliveryPartner/xpressbees",
                }));
                return {
                    success: false,
                    message: "An error occurred while cancelling the order",
                };
            }
            else {
                // Log unexpected errors
                console.error(JSON.stringify({
                    errorDetails: error,
                    path: "deliveryPartner/xpressbees",
                }));
                return {
                    success: false,
                    message: "An unexpected error occurred while cancelling the order",
                };
            }
        }
    });
}
function createXpressbeesNdr(order, data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        console.log("Starting createXpressbeesNdr for orderId:", order.orderId);
        console.log("Data:", data);
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("xpressbees");
            const orders = yield prisma_1.default.orders.findUnique({
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
            });
            if (!orders) {
                return { success: false, error: "Order not found" };
            }
            if (!orders.awbNumber) {
                return { success: false, error: "AWB number is missing" };
            }
            let actionType = "re-attempt";
            const actionData = {};
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const formattedDate = tomorrow.toISOString().split('T')[0];
            actionData.re_attempt_date = formattedDate;
            const isReAttemptOnly = JSON.stringify(data) === "{}";
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
            const requestBody = [
                {
                    awb: orders.awbNumber,
                    action: actionType,
                    action_data: actionData
                }
            ];
            console.log("XpressBees NDR request body:", JSON.stringify(requestBody));
            try {
                const response = yield axios_1.default.post("https://shipment.xpressbees.com/api/ndr/create", requestBody, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                });
                console.log("XpressBees NDR Response:", response.data);
                if (Array.isArray(response.data) && response.data.length > 0) {
                    const result = response.data[0];
                    if (result.status === true) {
                        if ((actionType === "change_address" || actionType === "change_phone") &&
                            (data.address || data.phone)) {
                            try {
                                const customerId = orders.forwardCustomerId || orders.reverseCustomerId;
                                if (customerId) {
                                    yield prisma_1.default.customerAddress.update({
                                        where: {
                                            customerId: customerId
                                        },
                                        data: {
                                            address: data.address || undefined,
                                            contactNumber: data.phone || undefined
                                        }
                                    });
                                    console.log("Customer address updated successfully");
                                }
                            }
                            catch (dbError) {
                                console.error("Error updating customer address:", dbError);
                            }
                        }
                        return {
                            success: true,
                            message: `XpressBees NDR ${actionType} created successfully`,
                            data: result
                        };
                    }
                    else {
                        return {
                            success: false,
                            error: result.message || "Failed to create XpressBees NDR"
                        };
                    }
                }
                else {
                    return {
                        success: false,
                        error: "Invalid response format from XpressBees API"
                    };
                }
            }
            catch (apiError) {
                if (axios_1.default.isAxiosError(apiError) && apiError.response) {
                    console.error("XpressBees API Error:", {
                        status: apiError.response.status,
                        statusText: apiError.response.statusText,
                        data: apiError.response.data
                    });
                    if (Array.isArray(apiError.response.data) && apiError.response.data.length > 0) {
                        const result = apiError.response.data[0];
                        return {
                            success: false,
                            error: result.message || "XpressBees API error"
                        };
                    }
                    const errorMessage = ((_c = apiError.response.data) === null || _c === void 0 ? void 0 : _c.message) ||
                        ((_d = apiError.response.data) === null || _d === void 0 ? void 0 : _d.error) ||
                        "Error from XpressBees API";
                    return { success: false, error: errorMessage };
                }
                if (apiError instanceof Error) {
                    return { success: false, error: apiError.message };
                }
                return { success: false, error: "Unknown error occurred while creating XpressBees NDR" };
            }
        }
        catch (error) {
            console.error("Error in createXpressbeesNdr:", error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                if (Array.isArray(error.response.data) && error.response.data.length > 0) {
                    const result = error.response.data[0];
                    return {
                        success: false,
                        error: result.message || "XpressBees API error"
                    };
                }
                return {
                    success: false,
                    error: ((_e = error.response.data) === null || _e === void 0 ? void 0 : _e.message) || 'Unknown API error'
                };
            }
            if (error instanceof Error) {
                return { success: false, error: error.message };
            }
            return {
                success: false,
                error: "An unexpected error occurred while creating XpressBees NDR request"
            };
        }
    });
}
