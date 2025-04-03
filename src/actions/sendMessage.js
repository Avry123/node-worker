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
exports.sendOrderSMS = sendOrderSMS;
var axios_1 = require("axios");
var prisma_1 = require("../lib/prisma");
function sendOrderSMS(orderId, user) {
    return __awaiter(this, void 0, void 0, function () {
        var currentUser, startTime, orderDetails, phoneNumber, options, data, endTime, totalTime, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentUser = user;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    startTime = Date.now();
                    if (!currentUser) {
                        console.log("User authentication failed. Please log in again.");
                        return [2 /*return*/, { success: false, message: "No current user found" }];
                    }
                    console.log("Current user: ".concat(currentUser.userid));
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
                            where: { id: orderId },
                            include: {
                                customerAddress: true,
                            },
                        })];
                case 2:
                    orderDetails = _a.sent();
                    if (!orderDetails || !orderDetails.customerAddress) {
                        console.error("Order or customer details not found");
                        return [2 /*return*/, { success: false, message: "Invalid order ID" }];
                    }
                    phoneNumber = orderDetails.customerAddress.contactNumber;
                    if (!phoneNumber) {
                        console.error("Customer contact number is missing");
                        return [2 /*return*/, { success: false, message: "Invalid phone number" }];
                    }
                    options = {
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
                                    mobiles: "91".concat(phoneNumber),
                                    var1: orderDetails.customerAddress.fullName,
                                    var2: orderDetails.awbNumber || "N/A",
                                    var3: (user === null || user === void 0 ? void 0 : user.storeName) || "",
                                },
                            ],
                        },
                    };
                    return [4 /*yield*/, axios_1.default.request(options)];
                case 3:
                    data = (_a.sent()).data;
                    endTime = Date.now();
                    totalTime = (endTime - startTime) / 1000;
                    console.log("\u23F1\uFE0F get SEND ORDER SMS: ".concat(totalTime, " seconds"));
                    return [2 /*return*/, { success: true, data: data }];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error sending SMS notification:", error_1);
                    return [2 /*return*/, {
                            success: false,
                            error: "Failed to send SMS notification",
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
