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
exports.createSmartrOrder = createSmartrOrder;
exports.cancelSmartrOrder = cancelSmartrOrder;
exports.downloadSmartrLabel = downloadSmartrLabel;
const axios_1 = __importDefault(require("axios"));
// import { revalidatePath } from "next/cache";
// import { getDeliveryPartnerId } from "../orders"
const tokenManager_1 = require("./tokenManager");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const client_1 = require("@prisma/client");
function createSmartrOrder(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        console.log("Inside Smartr");
        const responseOrderId = orderId + Math.floor(100 + Math.random() * 900).toString();
        // Fetch order details from the database
        const order = yield prisma_1.default.orders.findUnique({
            where: { id: orderId },
            include: {
                customerAddress: true,
                Packages: true,
            },
        });
        if (!order) {
            console.error("Order not found");
            return { success: false, error: "Order not found" };
        }
        const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("smartr");
        // Fetch warehouse address
        const warehouseAddress = yield prisma_1.default.address.findFirst({
            where: {
                id: order.agentAddressId || undefined,
            },
        });
        if (!warehouseAddress) {
            console.error("Warehouse address not found");
            return { success: false, error: "Warehouse address not found" };
        }
        const customerAddress = order.customerAddress;
        if (!customerAddress) {
            console.error("Customer address not found");
            return { success: false, error: "Customer address not found" };
        }
        const collectableValue = ((_a = order.paymentMode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "prepaid" ? 0 : order.totalOrderValue;
        // Prepare request body
        const requestBody = [
            {
                packageDetails: {
                    awbNumber: "",
                    orderNumber: responseOrderId,
                    productType: ((_b = order.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "prepaid" ? "ACP" : "ACC",
                    collectableValue: collectableValue,
                    itemDesc: order.Packages.map((item) => item.productName).join(", "),
                    declaredValue: (_c = order.totalOrderValue) === null || _c === void 0 ? void 0 : _c.toString(),
                    dimensions: `${order.length || 0}~${order.breadth || 0}~${order.height || 0}~1~${order.deadWeight || 0}~0/`,
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
        // Make API call to add order
        const response = yield axios_1.default.post("https://api.smartr.in/api/v1/add-order/", requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Cookie: "csrftoken=38d9eQOFJxf031Ur2c6a6sqME64mEqsfB20rBsHDkDPGLhyasgFCd9JPLChMhiL1; sessionid=u787x2cfam7yj3fvjco1sbewmw800rys",
            },
        });
        console.log("API Response:", response.data);
        if (response.data.total_success && response.data.total_success.length > 0) {
            console.log("Order creation successful");
            const awbNumber = response.data.total_success[0].awbNumber;
            const updatedOrder = yield prisma_1.default.orders.update({
                where: { id: order.orderId },
                data: {
                    status: client_1.OrderStatus.READY_TO_SHIP,
                    awbNumber: awbNumber,
                },
            });
            console.log("Order updated with AWB number:", updatedOrder);
            // revalidatePath("/orders");
            return updatedOrder;
        }
        else {
            // toast.error(`Failed to ship order ${response.data.total_failure[0].error}`)
            console.error(`Reason: ${response.data.total_failure[0].error}`);
        }
    });
}
function cancelSmartrOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("awbNumber:", awbNumber);
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("smartr");
            console.log("The cancelSmartOrder is triggered, the token ", token);
            const response = yield axios_1.default.post("https://api.smartr.in/api/v1/updateCancel/", {
                awbs: [awbNumber],
            }, {
                headers: {
                    " Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Cookie: "csrftoken=38d9eQOFJxf031Ur2c6a6sqME64mEqsfB20rBsHDkDPGLhyasgFCd9JPLChMhiL1; sessionid=u787x2cfam7yj3fvjco1sbewmw800rys",
                },
            });
            console.log("Cancellation Response:", response.data.data[0].awb);
            if (response.status === 200) {
                yield prisma_1.default.orders.update({
                    where: { awbNumber: awbNumber },
                    data: {
                        status: client_1.OrderStatus.NEW,
                        awbNumber: null,
                        deliveryPartner: null,
                    },
                });
                console.log(`Order with AWB number ${awbNumber} has been successfully cancelled.`);
                // revalidatePath(`/orders`);
                return { success: true, message: "Order cancelled successfully" };
            }
            else {
                // console.error("Failed to cancel order:", response.status);
                // return {success: false,message:'Order cancellation unsuccessfully'};
            }
        }
        catch (error) {
            console.error("Error cancelling order:", error);
            return error;
        }
    });
}
function downloadSmartrLabel(awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("smartr");
            console.log("AWB number ", awbNumber);
            const response = yield axios_1.default.get(`https://api.smartr.in/api/v1/generateLabel/?awbs=${awbNumber}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Cookie: "csrftoken=38d9eQOFJxf031Ur2c6a6sqME64mEqsfB20rBsHDkDPGLhyasgFCd9JPLChMhiL1; sessionid=u787x2cfam7yj3fvjco1sbewmw800rys",
                },
            });
            if (response.data.success) {
                // console.log("Label URL:", response.data.labelUrl);
                return { success: true };
            }
            else {
                console.error("Failed to generate label:", response.data.error);
                return { success: false };
            }
        }
        catch (error) {
            console.error("Error downloading label:", error);
            return { success: false };
        }
    });
}
