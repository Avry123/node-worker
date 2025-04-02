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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderSMS = sendOrderSMS;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../lib/prisma"));
function sendOrderSMS(orderId, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentUser = user;
        try {
            const startTime = Date.now();
            if (!currentUser) {
                console.log("User authentication failed. Please log in again.");
                return { success: false, message: "No current user found" };
            }
            console.log(`Current user: ${currentUser.userid}`);
            const orderDetails = yield prisma_1.default.orders.findUnique({
                where: { id: orderId },
                include: {
                    customerAddress: true,
                },
            });
            if (!orderDetails || !orderDetails.customerAddress) {
                console.error("Order or customer details not found");
                return { success: false, message: "Invalid order ID" };
            }
            const phoneNumber = orderDetails.customerAddress.contactNumber;
            if (!phoneNumber) {
                console.error("Customer contact number is missing");
                return { success: false, message: "Invalid phone number" };
            }
            const options = {
                method: "POST",
                url: "https://control.msg91.com/api/v5/flow",
                headers: {
                    authkey: process.env.MSG91_AUTH_KEY,
                    accept: "application/json",
                    "content-type": "application/json",
                },
                data: {
                    template_id: "67389037d6fc05116a123072",
                    short_url: "0",
                    realTimeResponse: "1",
                    recipients: [
                        {
                            mobiles: `91${phoneNumber}`,
                            var1: orderDetails.customerAddress.fullName,
                            var2: orderDetails.awbNumber || "N/A",
                            var3: (user === null || user === void 0 ? void 0 : user.storeName) || "",
                        },
                    ],
                },
            };
            // console.log("SMS Options:", JSON.stringify(options.data, null, 2));
            const { data } = yield axios_1.default.request(options);
            // console.log("SMS notification sent successfully:", data);
            const endTime = Date.now();
            const totalTime = (endTime - startTime) / 1000;
            console.log(`⏱️ get SEND ORDER SMS: ${totalTime} seconds`);
            return { success: true, data };
        }
        catch (error) {
            console.error("Error sending SMS notification:", error);
            return {
                success: false,
                error: "Failed to send SMS notification",
            };
        }
    });
}
