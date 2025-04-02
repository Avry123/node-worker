"use strict";
// "use server";
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
exports.createShadowfaxOrder = createShadowfaxOrder;
exports.createReverseShadowfaxOrder = createReverseShadowfaxOrder;
exports.cancelShadowfaxOrder = cancelShadowfaxOrder;
exports.cancelReverseShadowfaxOrder = cancelReverseShadowfaxOrder;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const tokenManager_1 = require("./tokenManager");
const prisma_1 = __importDefault(require("../../lib/prisma"));
function generateRandomOrderId(orderId) {
    const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `${orderId}-${randomNum}`;
}
function createShadowfaxOrder(orderId, type) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            let token;
            if (type == "surface") {
                token = yield (0, tokenManager_1.getDeliveryPartnerToken)("shadowfax");
            }
            else if (type == "sdd/ndd") {
                console.log("Shadowfax SDD/NDD token");
                token = yield (0, tokenManager_1.getDeliveryPartnerToken)("shadowfaxsdd");
            }
            const clientOrderId = orderId + Math.floor(100 + Math.random() * 900).toString();
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
                return { success: false, error: "Warehouse not found" };
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
                product_details: order.Packages.map((item) => ({
                    hsn_code: item.hsn || "N/A",
                    sku_name: item.productName,
                    sku_id: item.sku || "N/A",
                    category: item.category || "N/A",
                    price: Number(item.price),
                })),
            };
            const response = yield axios_1.default.post("https://dale.shadowfax.in/api/v3/clients/orders/", requestBody, {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
            });
            console.log(JSON.stringify(requestBody), "requestBody for shadowfax");
            //console.log('hi',response.data)
            if (response.data.message !== "Success") {
                console.error(JSON.stringify({
                    errorDetails: response.data.errors,
                    path: "deliveryPartner/shadowfax",
                }));
                return { success: false, error: response.data.errors };
            }
            const awbNumber = response.data.data.awb_number;
            const updatedOrder = yield prisma_1.default.orders.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.READY_TO_SHIP,
                    awbNumber: awbNumber,
                    shippingDate: new Date(),
                },
            });
            const safeToNumber = (value) => {
                return value ? value.toNumber() : null;
            };
            return {
                success: true,
                order: Object.assign(Object.assign({}, updatedOrder), { deadWeight: safeToNumber(updatedOrder.deadWeight), breadth: safeToNumber(updatedOrder.breadth), height: safeToNumber(updatedOrder.height), length: safeToNumber(updatedOrder.length), applicableWeight: safeToNumber(updatedOrder.applicableWeight), totalOrderValue: safeToNumber(updatedOrder.totalOrderValue) }),
                awbNumber: awbNumber,
                clientOrderId: clientOrderId, // Include it in the return value if needed for reference
            };
        }
        catch (error) {
            //console.error("Error in createShadowfaxOrder:", error);
            let errorMessage = "An unknown error occurred";
            if (error.response && error.response.data && error.response.data.errors) {
                errorMessage = error.response.data.errors;
            }
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            return { success: false, error: errorMessage };
        }
    });
}
// export async function downloadShadowfaxLabel(
//   awbNumber: string,
// ): Promise<string> {
//   // Implement label download logic here
//   console.error("Not implemented");
// }
function createReverseShadowfaxOrder(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("shadowfax");
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
            const pickupAddress = yield prisma_1.default.customerAddress.findFirst({
                where: {
                    customerId: order.reverseAgentAddressId || undefined,
                },
            });
            if (!pickupAddress) {
                console.error("Warehouse address not found");
                return { success: false, error: "Warehouse address not found" };
            }
            const customerAddress = yield prisma_1.default.address.findFirst({
                where: {
                    id: order.reverseCustomerId || undefined,
                },
            });
            const requestBody = {
                // Required string fields
                client_order_number: generateRandomOrderId(order.orderId),
                warehouse_name: ((_a = order === null || order === void 0 ? void 0 : order.Users) === null || _a === void 0 ? void 0 : _a.StoreName) || (customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.tag),
                warehouse_address: (customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.address) || "Client Warehouse Address",
                destination_pincode: customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.pincode,
                unique_code: `warehouse${orderId}`,
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
                skus_attributes: order.Packages.map((item) => ({
                    // Required SKU fields
                    name: item.productName || "N/A",
                    price: parseFloat(item.price) || 0,
                    client_sku_id: item.sku || "N/A",
                    hsn_code: item.hsn || "",
                    invoice_id: " ",
                    return_reason: "",
                    // Required seller_details
                    seller_details: {
                        regd_name: (customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.tag) || "N/A",
                        regd_address: (customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.address) || "N/A",
                        state: (customerAddress === null || customerAddress === void 0 ? void 0 : customerAddress.state) || "N/A",
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
                })),
            };
            const response = yield axios_1.default.post("https://dale.shadowfax.in/api/v3/clients/requests", requestBody, {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
            });
            console.log(requestBody, "requestBody for shadowfax");
            console.log("dataaa", response, "response for shadowfax");
            if (response.data.message === "Success") {
                const result = yield prisma_1.default.$transaction((prismaTransaction) => __awaiter(this, void 0, void 0, function* () {
                    return yield prismaTransaction.orders.update({
                        where: { id: orderId },
                        data: {
                            status: client_1.OrderStatus.READY_TO_SHIP,
                            awbNumber: response.data.awb_number,
                            shippingDate: new Date(),
                        },
                    });
                }));
                return {
                    success: true,
                    awbNumber: response.data.awb_number,
                };
            }
            else {
                return {
                    success: false,
                    error: response.data.errors ||
                        response.data.message ||
                        "Failed to create Shadowfax order",
                };
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                // Detailed Axios error handling
                console.error("Axios Error Response:", (_c = error.response) === null || _c === void 0 ? void 0 : _c.data);
                console.error("Axios Error Status:", (_d = error.response) === null || _d === void 0 ? void 0 : _d.status);
                console.error("Axios Error Headers:", (_e = error.response) === null || _e === void 0 ? void 0 : _e.headers);
                console.error("Axios Error Message:", error.message);
                return {
                    success: false,
                    error: `Failed to create Shadowfax order: ${((_g = (_f = error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.message) || error.message || "Unknown error"}`,
                };
            }
            else {
                // General error handling
                console.error("Error in createReverseShadowfaxOrder:", error);
                return {
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to create Shadowfax order",
                };
            }
        }
    });
}
function cancelShadowfaxOrder(awbNumber, type) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let token;
            if (type == "surface") {
                token = yield (0, tokenManager_1.getDeliveryPartnerToken)("shadowfax");
            }
            else if (type == "sdd/ndd") {
                console.log("Shadowfax SDD/NDD token");
                token = yield (0, tokenManager_1.getDeliveryPartnerToken)("shadowfaxsdd");
            }
            const requestBody = {
                request_id: awbNumber,
            };
            // console.log("Shadowfax Cancel API requestBody:", requestBody);
            //    console.log("token:",token);
            const response = yield axios_1.default.post("https://dale.shadowfax.in/api/v3/clients/orders/cancel/", requestBody, {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
            });
            //   console.log("Shadowfax Cancel API Response:", response.data);
            if (response.data.responseMsg === "Request has been marked as cancelled" ||
                response.data.responseMsg ===
                    "The request is already in its cancellation phase" ||
                response.data.responseMsg ===
                    "Cannot cancel order from Cancelled By Customer" ||
                response.data.responseCode === 200) {
                return {
                    success: true,
                    message: response.data.responseMsg || "Order cancelled successfully",
                };
            }
            else {
                const errorMessage = response.data.responseMsg || "Failed to cancel order with Shadowfax";
                console.error(JSON.stringify({
                    message: "Failed cancelling Shadowfax order:",
                    errorDetails: errorMessage,
                    path: "deliveryPartner/shadowfax",
                }));
                return {
                    success: false,
                    message: errorMessage,
                };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to cancel Shadowfax order";
            console.error(JSON.stringify({
                message: "Error cancelling Shadowfax order:",
                errorDetails: error,
                path: "deliveryPartner/shadowfax",
            }));
            return {
                success: false,
                message: errorMessage,
            };
        }
    });
}
function cancelReverseShadowfaxOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("Shadowfax");
            //console.log("Cancelling Shadowfax order reverse");
            const requestBody = {
                request_id: awbNumber,
                cancel_remarks: "cancelled by customer",
            };
            //console.log('Request body:', requestBody);
            const response = yield axios_1.default.post("https://dale.shadowfax.in/api/v2/clients/requests/mark_cancel", requestBody, {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
            });
            //console.log("Shadowfax Cancel API Response:", response.data);
            if (response.data.responseCode === 200) {
                //console.log("Order cancellation successful");
                return {
                    success: true,
                    message: "Order cancelled successfully",
                    data: response.data,
                };
            }
            else {
                console.error(JSON.stringify({
                    data: "Failed to cancel order:",
                    meesage: response.data.message || response.statusText,
                    path: "deliveryPartner/shadowfax",
                }));
                return {
                    success: false,
                    message: response.data.message || "Failed to cancel order with Shadowfax",
                    data: response.data,
                };
            }
        }
        catch (error) {
            console.error(JSON.stringify({
                data: "Error cancelling Shadowfax order:",
                message: error,
            }));
            return {
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Failed to cancel Shadowfax order",
                error: error,
            };
        }
    });
}
