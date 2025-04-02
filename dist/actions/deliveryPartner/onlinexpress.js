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
exports.createOnlineXpressOrder = createOnlineXpressOrder;
exports.cancelOnlineXpressOrder = cancelOnlineXpressOrder;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const tokenManager_1 = require("./tokenManager");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const safeToNumber = (value) => {
    return value ? value.toNumber() : null;
};
function generateRandomOrderId(orderId) {
    const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `${orderId}-${randomNum}`;
}
function createOnlineXpressOrder(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            console.log("Starting createOnlineXpressOrder for orderId:", orderId);
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("onlinexpress");
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
                console.error(`Order not found for orderId: ${orderId}`);
                return { success: false, error: "Order not found" };
            }
            // if (order.awbNumber) {
            //   console.log("Order already has an AWB number:", order.awbNumber);
            //   return { success: true, awbNumber: order.awbNumber };
            // }
            const warehouseAddress = yield prisma_1.default.address.findUnique({
                where: { id: (_a = order.agentAddressId) !== null && _a !== void 0 ? _a : undefined },
            });
            if (!warehouseAddress) {
                console.error("Warehouse address not found");
                return { success: false, error: "Warehouse address is required" };
            }
            // Warehouse creation logic
            const warehouseDetails = {
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
            try {
                const warehouseResponse = yield axios_1.default.post("https://onlinexpress.co.in/admin/services/addData/pickup", warehouseDetails, {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        AUTH_USER: "SHYPBUDDY INDIA PRIVATE LIMITED",
                        AUTH_PW: `${token}`,
                    },
                });
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
            }
            catch (warehouseError) {
                console.warn("Warehouse creation failed, proceeding with existing warehouse:", warehouseError);
            }
            // Order creation logic
            const customerAddress = order.customerAddress;
            const collectableAmount = ((_d = order.paymentMode) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === "cod" ? order.totalOrderValue : 0;
            const requestBody = {
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
                        PRODUCTS: order.Packages.map((item) => ({
                            "SKU CODE": item.sku || "dummy SKU",
                            QUANTITY: item.quantity,
                            BRAND: "",
                            COLOR: "",
                            REASON: "",
                            IMAGES: "",
                        })),
                    },
                ],
                branch_id: "1",
                user: "SHYPBUDDY INDIA PRIVATE LIMITED",
                from_api: "y",
            };
            console.log("Online Xpress API request body:", JSON.stringify(requestBody, null, 2));
            console.log("About to make Online Xpress API call for shipping");
            const response = yield axios_1.default.post("https://onlinexpress.co.in/admin/services/booking", requestBody, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    AUTH_USER: "SHYPBUDDY INDIA PRIVATE LIMITED",
                    AUTH_PW: `${token}`,
                },
            });
            //   console.log("Online Xpress API call completed");
            console.log("Online Xpress API response:", JSON.stringify({
                data: response.data,
                path: "deliveryPartner/onlinexpress",
            }));
            if (response.data && response.data.success) {
                const awbNumber = response.data.successfulAWBS[0];
                // Update the order status and AWB number
                const updatedOrder = yield prisma_1.default.orders.update({
                    where: { id: orderId },
                    data: {
                        status: client_1.OrderStatus.READY_TO_SHIP,
                        awbNumber: awbNumber,
                        shippingDate: new Date(),
                    },
                });
                // console.log("Updated order with shipment details:", updatedOrder);
                // revalidatePath("/orders");
                return { success: true, awbNumber };
            }
            else {
                console.error(JSON.stringify({
                    message: `Failed to create Online Xpress order: ${response.data.message || "Unknown error"}`,
                    path: "deliverypartner/onlinexpress",
                }));
            }
        }
        catch (error) {
            console.error(JSON.stringify({
                message: "Error creating Online Xpress shipment:",
                errorDetails: error,
                path: "deliverypartner/onlinexpress",
            }));
            // Update order status to CANCELLED if shipment creation fails
            yield prisma_1.default.orders.update({
                where: { id: orderId },
                data: { status: "NEW" },
            });
            if (error instanceof Error) {
                return { success: false, error: error.message };
            }
            else {
                return { success: false, error: "An unknown error occurred" };
            }
        }
    });
}
function cancelOnlineXpressOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //   console.log("awbNumber line no. 232:", awbNumber);
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("onlinexpress");
            const response = yield axios_1.default.get(`https://onlinexpress.co.in/admin/services/cancelRequest?awbs=${awbNumber}`, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    AUTH_USER: "SHYPBUDDY INDIA PRIVATE LIMITED",
                    AUTH_PW: `${token}`,
                },
            });
            // console.log(
            //   "Cancellation Response from OnlineXpress line 254:",
            //   response.data,
            // );
            if (response.data.failure.length == 0) {
                // Fetch the order first to ensure it exists
                const order = yield prisma_1.default.orders.findUnique({
                    where: { awbNumber: awbNumber },
                });
                if (!order) {
                    console.error(`Order with AWB number ${awbNumber} not found in the database.`);
                    return { success: false, message: "Order not found in the database" };
                }
                console.log(`Order with AWB number ${awbNumber} has been successfully cancelled.`);
                // revalidatePath(`/orders`);
                return { success: true, message: "Order cancelled successfully" };
                // return(r)
            }
            else {
                JSON.stringify({
                    message: "Error cancelling  order:",
                    errorDetails: response.status,
                    path: "deliverypartner/onlineexpress",
                });
                return { success: false, message: "Order cancellation unsuccessfully" };
            }
        }
        catch (error) {
            console.error(JSON.stringify({
                message: "Error cancelling order:",
                errorDetails: error,
                path: "deliverypartner/onlineexpress",
            }));
            return {
                success: false,
                message: "An unexpected error occurred. Please try again.",
            };
        }
    });
}
