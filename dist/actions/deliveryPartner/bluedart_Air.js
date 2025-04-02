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
exports.createBluedart_Air = createBluedart_Air;
exports.cancel_bluedartAir = cancel_bluedartAir;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const user_1 = require("../user");
const tokenManager_1 = require("./tokenManager");
// import { revalidatePath } from "next/cache";
function createBluedart_Air(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("BlueDart_Air");
            const reference_id = orderId + Math.floor(Math.random() * 1000).toString();
            //  console.log('Line 16 ', reference_id);
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
            if (!(order === null || order === void 0 ? void 0 : order.agentAddressId)) {
                return { success: false, error: "Customer Details missing" };
            }
            const warehouse = yield prisma_1.default.address.findUnique({
                where: { id: order.agentAddressId },
            });
            const returnAddress = order.rtoAgentAddressId
                ? yield prisma_1.default.address.findUnique({
                    where: { id: order.rtoAgentAddressId },
                })
                : null;
            // First check if COD is available for the pincode
            const areacheck = yield fetch("https://apigateway.bluedart.com/in/transportation/finder/v1/GetServicesforPincode", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    JWTToken: token,
                },
                body: JSON.stringify({
                    pinCode: warehouse === null || warehouse === void 0 ? void 0 : warehouse.pincode,
                    profile: {
                        Api_type: "S",
                        LicenceKey: process.env.BLUEDART_AIR_LICENSE_KEY,
                        LoginID: process.env.BLUEDART_AIR_LOGIN_ID,
                    },
                }),
            });
            const areacode = yield areacheck.json();
            // Check if COD is allowed for this pincode
            const isCODOrder = ((_a = order.paymentMode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "cod";
            const collectableAmount = isCODOrder ? order.totalOrderValue || 0 : 0;
            // If COD is not available for this pincode and it's a COD order, return early
            if (isCODOrder && !((_b = areacode.GetServicesforPincodeResult) === null || _b === void 0 ? void 0 : _b.CODAvailable)) {
                return {
                    success: false,
                    error: "Cash on Delivery (COD) is not available for the given pincode. Please choose prepaid payment mode.",
                };
            }
            const requestBody = {
                Request: {
                    Consignee: {
                        ConsigneeAddress1: ((_c = order.customerAddress) === null || _c === void 0 ? void 0 : _c.address) || "",
                        ConsigneeEmailID: ((_d = order.customerAddress) === null || _d === void 0 ? void 0 : _d.email) || "",
                        ConsigneeMobile: ((_e = order.customerAddress) === null || _e === void 0 ? void 0 : _e.contactNumber) || "",
                        ConsigneeName: ((_f = order.customerAddress) === null || _f === void 0 ? void 0 : _f.fullName) || "",
                        ConsigneePincode: ((_g = order.customerAddress) === null || _g === void 0 ? void 0 : _g.pincode) || "",
                    },
                    Services: {
                        AWBNo: "",
                        ActualWeight: order.applicableWeight || 0,
                        CollectableAmount: collectableAmount,
                        CreditReferenceNo: reference_id,
                        DeclaredValue: order.totalOrderValue || 0,
                        Dimensions: [
                            {
                                Breadth: order.breadth || 0,
                                Height: order.height || 0,
                                Length: order.length || 0,
                            },
                        ],
                        IsDedicatedDeliveryNetwork: false,
                        IsDutyTaxPaidByShipper: false,
                        IsForcePickup: false,
                        IsPartialPickup: false,
                        IsReversePickup: false, // Changed to false as true might be causing issues
                        Officecutofftime: "",
                        PDFOutputNotRequired: true,
                        PickupTime: "1600",
                        PieceCount: "1",
                        ProductCode: "A",
                        ProductType: 1,
                        RegisterPickup: true,
                        SubProductCode: isCODOrder ? "C" : "P",
                        itemdtl: order.Packages.map((item) => ({
                            ItemID: item.PackageId.toString(),
                            ItemName: item.productName || "",
                            ItemValue: item.price || 0,
                            Itemquantity: item.quantity || 0,
                        })),
                        noOfDCGiven: 0,
                    },
                    Shipper: {
                        CustomerAddress1: (warehouse === null || warehouse === void 0 ? void 0 : warehouse.address) || "",
                        CustomerCode: process.env.BLUEDART_AIR_CUSTOMER_CODE || 701245,
                        CustomerEmailID: (warehouse === null || warehouse === void 0 ? void 0 : warehouse.email) || "",
                        CustomerMobile: (warehouse === null || warehouse === void 0 ? void 0 : warehouse.contactNumber) || "",
                        CustomerName: ((_h = order === null || order === void 0 ? void 0 : order.Users) === null || _h === void 0 ? void 0 : _h.StoreName) || (warehouse === null || warehouse === void 0 ? void 0 : warehouse.tag) || "",
                        CustomerPincode: (warehouse === null || warehouse === void 0 ? void 0 : warehouse.pincode) || "",
                        IsToPayCustomer: isCODOrder,
                        OriginArea: ((_j = areacode.GetServicesforPincodeResult) === null || _j === void 0 ? void 0 : _j.AreaCode) || "",
                    },
                    Returnadds: {
                        ReturnAddress1: (returnAddress === null || returnAddress === void 0 ? void 0 : returnAddress.address) || "",
                        ReturnEmailID: (returnAddress === null || returnAddress === void 0 ? void 0 : returnAddress.email) || "",
                        ReturnMobile: (returnAddress === null || returnAddress === void 0 ? void 0 : returnAddress.contactNumber) || "",
                        ReturnPincode: (returnAddress === null || returnAddress === void 0 ? void 0 : returnAddress.pincode) || "",
                    },
                },
                Profile: {
                    LoginID: process.env.BLUEDART_AIR_LOGIN_ID || "",
                    LicenceKey: process.env.BLUEDART_AIR_LICENSE_KEY || "",
                    Api_type: "S",
                },
            };
            console.log("BlueDart Request Body:", JSON.stringify(requestBody));
            const response = yield fetch("https://apigateway.bluedart.com/in/transportation/waybill/v1/GenerateWayBill", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    JWTToken: token,
                },
                body: JSON.stringify(requestBody),
            });
            const responseData = yield response.json();
            console.log(JSON.stringify({
                data: responseData,
                path: "deliveryPartner/bluedart_air",
            }));
            // Handle BlueDart specific errors
            if (!response.ok || responseData["error-response"]) {
                const errorResponse = (_k = responseData["error-response"]) === null || _k === void 0 ? void 0 : _k[0];
                if (((_l = errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.Status) === null || _l === void 0 ? void 0 : _l.length) > 0) {
                    const errorMessages = errorResponse.Status.map((status) => `${status.StatusInformation}`).join(", ");
                    return {
                        success: false,
                        error: `BlueDart Error: ${errorMessages}`,
                    };
                }
                return {
                    success: false,
                    error: `BlueDart API Error: ${JSON.stringify(responseData)}`,
                };
            }
            const regex = /\/Date\((\d+)([+-]\d{4})\)\//;
            const [, timestamp] = responseData.GenerateWayBillResult.ShipmentPickupDate.match(regex);
            const date = new Date(parseInt(timestamp));
            const TokenNumber = responseData.GenerateWayBillResult.TokenNumber.replace("DEMO", "");
            //    console.log('Line 177 ', TokenNumber);
            const updatedOrder = yield prisma_1.default.orders.update({
                where: { id: orderId },
                data: {
                    pickupTime: date,
                },
            });
            // revalidatePath("/orders");
            return {
                success: true,
                order: (0, user_1.serializeDecimal)(updatedOrder),
                awbNumber: responseData.GenerateWayBillResult.AWBNo,
                label: "",
            };
        }
        catch (error) {
            console.error(JSON.stringify({
                data: "Error in createBluedart_Air:",
                error,
                path: "deliveryPartner/bluedart_air",
            }));
            return {
                success: false,
                error: error instanceof Error ? error.message : "An unknown error occurred",
            };
        }
    });
}
function cancel_bluedartAir(awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("BlueDart_Air");
            // Construct the request body in the desired format
            const requestBody = {
                Request: {
                    AWBNo: awbNumber, // Pass the AWB number dynamically
                },
                Profile: {
                    LoginID: process.env.BLUEDART_AIR_LOGIN_ID, // Use environment variables for dynamic values
                    Api_type: "S",
                    LicenceKey: process.env.BLUEDART_AIR_LICENSE_KEY, // Use environment variables for dynamic values
                },
            };
            // Log the request body in a readable format before making the API call
            //   console.log("Request Body:", JSON.stringify(requestBody, null, 2));
            const response = yield fetch("https://apigateway.bluedart.com/in/transportation/waybill/v1/CancelWaybill", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    JWTToken: token,
                },
                body: JSON.stringify(requestBody),
            });
            const responseData = yield response.json();
            console.log(JSON.stringify({
                data: responseData,
                path: "deliveryPartner/bluedart_air",
            }));
            // Get error message from any of the possible error formats
            const errorMsg = ((_d = (_c = (_b = (_a = responseData["error-response"]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.Status) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.StatusInformation) ||
                ((_e = responseData["error-response"]) === null || _e === void 0 ? void 0 : _e[0]) ||
                ((_h = (_g = (_f = responseData.CancelWayBillResult) === null || _f === void 0 ? void 0 : _f.Status) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.StatusInformation);
            // If error message includes 'already cancelled', treat as success
            if ((errorMsg === null || errorMsg === void 0 ? void 0 : errorMsg.toLowerCase().includes("already cancelled")) ||
                responseData.status == 415) {
                return {
                    success: true,
                    message: "Order already cancelled",
                };
            }
            // If there's an error message and it's not about already being cancelled, return it
            if (errorMsg) {
                return {
                    success: false,
                    error: errorMsg,
                };
            }
            // If no error was found, assume success
            return {
                success: true,
                message: "Order cancelled successfully",
            };
        }
        catch (error) {
            console.error(JSON.stringify({
                data: "Error in cancel_bluedartAir:",
                error,
                path: "deliveryPartner/bluedart_air",
            }));
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    });
}
