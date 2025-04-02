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
exports.createSmartshipOrder = createSmartshipOrder;
exports.cancelSmartship = cancelSmartship;
exports.createSmartshipNdr = createSmartshipNdr;
const axios_1 = __importDefault(require("axios"));
const tokenManager_1 = require("./tokenManager");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const client_1 = require("@prisma/client");
function registerSmartshipHub(order, warehouseAddress, token, shypmentType) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            // Validate required fields
            if (!warehouseAddress) {
                return { success: false, error: "Warehouse address is required" };
            }
            // Phone number validation
            const phoneNumber = (_a = warehouseAddress.contactNumber) === null || _a === void 0 ? void 0 : _a.replace(/\D/g, "");
            if (!phoneNumber || phoneNumber.length !== 10) {
                return {
                    success: false,
                    error: "Invalid phone number. Please provide a 10-digit phone number.",
                };
            }
            // const  deliveryTypeId = order.applicableWeight
            //   ? Number(order.applicableWeight) > 5
            //     ? 3
            //     : 2
            //   : 2;
            let deliveryTypeId;
            if (order.applicableWeight) {
                if (Number(order.applicableWeight) > 5) {
                    deliveryTypeId = 3;
                }
                else {
                    if (shypmentType === "air") {
                        deliveryTypeId = 1;
                    }
                    else {
                        deliveryTypeId = 2;
                    }
                }
            }
            const requestBody = {
                hub_details: {
                    hub_name: ((_b = order.Users) === null || _b === void 0 ? void 0 : _b.StoreName) || warehouseAddress.tag || "",
                    pincode: warehouseAddress.pincode || "",
                    city: warehouseAddress.city || "",
                    state: warehouseAddress.state || "",
                    address1: warehouseAddress.address || "",
                    hub_phone: phoneNumber,
                    delivery_type_id: deliveryTypeId,
                },
            };
            console.log(shypmentType, "requestBody", requestBody.hub_details.delivery_type_id);
            const hubDetails = yield fetch("https://api.smartship.in/v2/app/Fulfillmentservice/hubRegistration", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify(requestBody),
            });
            if (!hubDetails.ok) {
                console.error(`API request failed with status ${hubDetails.status}`);
                return {
                    success: false,
                    error: "Hub registration failed",
                };
            }
            const hub = yield hubDetails.json();
            // Handle validation errors
            if ((_d = (_c = hub.data) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.validation_error) {
                return {
                    success: false,
                    error: Array.isArray(hub.data.message.validation_error)
                        ? hub.data.message.validation_error.join(", ")
                        : hub.data.message.info || "Validation error occurred",
                };
            }
            // Extract hub ID based on response format
            const hubId = hub.message === "OK"
                ? (_f = (_e = hub.data) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.registered_hub_id
                : (_g = hub.data) === null || _g === void 0 ? void 0 : _g.hub_id;
            if (!hubId) {
                return {
                    success: false,
                    error: "Failed to get hub ID from response",
                };
            }
            return {
                success: true,
                hubId,
            };
        }
        catch (error) {
            console.error(JSON.stringify({
                errorDetails: error,
                path: "deliveryPartner/smartship/hubRegistration",
            }));
            return {
                success: false,
                error: error instanceof Error ? error.message : "An unknown error occurred",
            };
        }
    });
}
function createSmartshipOrder(orderId, shypmentType) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("smartship");
        const reference_id = orderId + Math.floor(Math.random() * 1000).toString();
        const order = yield prisma_1.default.orders.findUnique({
            where: { id: orderId },
            include: {
                PickUpAddress: true,
                customerAddress: true,
                Packages: true,
                Users: { select: { StoreName: true } },
            },
        });
        if (!(order === null || order === void 0 ? void 0 : order.agentAddressId)) {
            return { success: false, error: "Agent address not found" };
        }
        const warehouseAddress = yield prisma_1.default.address.findUnique({
            where: { id: order.agentAddressId },
        });
        try {
            const hubResult = yield registerSmartshipHub(order, warehouseAddress, token, shypmentType);
            if (!hubResult.success) {
                return { success: false, error: hubResult.error };
            }
            const hubId = hubResult.hubId;
            const collectableAmount = ((_a = order.paymentMode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "prepaid"
                ? 0
                : order.totalOrderValue;
            // if (shypmentType === "air") {
            //   //  http://api.smartship.in/v2/app/Fulfillmentservice/CarrierServiceablePincodes
            //   const createOrder = await fetch(
            //     "http://api.smartship.in/v2/app/Fulfillmentservice/CarrierServiceablePincodes",
            //     {
            //       method: "POST",
            //       headers: {
            //         "Content-Type": "application/json",
            //         Authorization: token,
            //       },
            //       body: JSON.stringify({
            //         carrier_info: {
            //           payment_type: "",
            //           carrier_id: ["282"],
            //         },
            //       }),
            //     },
            //   );
            //   const abc = await createOrder.json();
            //   console.log("shypmentType is air and response is ",abc.data[282].valid_pincode);
            // }
            const requestBody = {
                request_info: {
                    client_id: "7W1XHVLE2R75AVYI3IBS7C5KO9SV7M",
                    run_type: "create",
                    shipment_type: 1,
                },
                orders: [
                    {
                        client_order_reference_id: reference_id,
                        order_collectable_amount: collectableAmount,
                        total_order_value: order.totalOrderValue,
                        payment_type: order.paymentMode,
                        package_order_weight: (Number(order.applicableWeight) * 1000).toString(),
                        package_order_length: order.length,
                        package_order_height: order.height,
                        package_order_width: order.breadth,
                        shipper_hub_id: hubId,
                        order_invoice_number: "INV001",
                        order_invoice_date: new Date(),
                        order_meta: {
                            preferred_carriers: [shypmentType === "surface" ? 279 : 282],
                        },
                        product_details: order.Packages.map((item) => ({
                            client_product_reference_id: item.PackageId.toString(),
                            product_name: item.productName,
                            product_category: item.category,
                            product_quantity: item.quantity,
                            product_invoice_value: item.price,
                            product_gst_tax_rate: 18,
                        })),
                        consignee_details: {
                            consignee_name: (_b = order.customerAddress) === null || _b === void 0 ? void 0 : _b.fullName,
                            consignee_phone: (_c = order.customerAddress) === null || _c === void 0 ? void 0 : _c.contactNumber,
                            consignee_email: (_d = order.customerAddress) === null || _d === void 0 ? void 0 : _d.email,
                            consignee_complete_address: (_e = order.customerAddress) === null || _e === void 0 ? void 0 : _e.address,
                            consignee_pincode: (_f = order.customerAddress) === null || _f === void 0 ? void 0 : _f.pincode,
                        },
                    },
                ],
            };
            console.log(hubId, "shypmentType");
            const createOrder = yield fetch("https://api.smartship.in/v2/app/Fulfillmentservice/orderRegistrationOneStep", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify(requestBody),
            });
            console.log(requestBody, "requestBody for smartship");
            if (!createOrder.ok) {
                return { success: false, error: "Failed to create order" };
            }
            const data = yield createOrder.json();
            // Log error details if present
            if ((_h = (_g = data.data) === null || _g === void 0 ? void 0 : _g.errors) === null || _h === void 0 ? void 0 : _h.data_discrepancy) {
                console.error(JSON.stringify({
                    errorDetails: data.data.errors.data_discrepancy,
                    path: "deliveryPartner/smartship",
                }));
                return {
                    success: false,
                    error: (_j = data.data.errors.data_discrepancy[0]) === null || _j === void 0 ? void 0 : _j.error[0],
                };
            }
            // Check for NSS carrier
            const orderDetails = (_l = (_k = data === null || data === void 0 ? void 0 : data.data) === null || _k === void 0 ? void 0 : _k.success_order_details) === null || _l === void 0 ? void 0 : _l.orders[0];
            console.log(" line 158 of smartship", orderDetails);
            if ((orderDetails === null || orderDetails === void 0 ? void 0 : orderDetails.carrier_name) == "NSS") {
                return {
                    success: false,
                    error: "Pincode not serviceable",
                    message: "The delivery location is not serviceable",
                };
            }
            // Handle AWB number false case
            if ((orderDetails === null || orderDetails === void 0 ? void 0 : orderDetails.awb_number) === false) {
                return {
                    success: false,
                    error: "Pincode not serviceable",
                    message: "The delivery location is not serviceable",
                };
            }
            // Update order with AWB number
            yield prisma_1.default.orders.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.READY_TO_SHIP,
                    awbNumber: orderDetails.awb_number,
                    responseOrderId: reference_id,
                    SS_Delivery_Code: orderDetails.route_code,
                    shippingDate: new Date(),
                },
            });
            return {
                success: true,
                awbNumber: orderDetails.awb_number,
            };
        }
        catch (error) {
            console.error(JSON.stringify({
                errorDetails: error,
                path: "deliveryPartner/smartship",
            }));
            return {
                success: false,
                error: error instanceof Error ? error.message : "An unknown error occurred",
            };
        }
    });
}
function cancelSmartship(responseId, awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("smartship");
        // console.log(responseId, " this is the responseId");
        const response = yield fetch("https://api.smartship.in/v2/app/Fulfillmentservice/orderCancellation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify({
                orders: {
                    client_order_reference_ids: {
                        responseId,
                    },
                },
            }),
        });
        if (response.ok) {
            const data = yield response.json();
            // console.log(data, " line 233 of cancel smartship");
            console.error(JSON.stringify({
                errorDetails: (_a = data.data.order_cancellation_details) === null || _a === void 0 ? void 0 : _a.successful,
                path: "deliveryPartner/smartship",
            }));
            return { success: true, message: "Order cancelled successfully" };
        }
        else {
            return { success: false, message: "Order cancellation unsuccessfully" };
        }
    });
}
function createSmartshipNdr(order, data, action) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        console.log("Starting createSmartshipNdr for orderId:", order.orderId);
        console.log("Data:", data);
        try {
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("smartship");
            const orders = yield prisma_1.default.orders.findUnique({
                where: { orderId: Number(order.orderId) },
                include: {
                    customerAddress: true,
                },
            });
            if (!orders) {
                return { success: false, error: "Order not found" };
            }
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const formattedDate = tomorrow.toISOString().split('T')[0];
            const nextAttemptDate = formattedDate;
            const requestBody = {
                orders: [
                    {
                        client_order_reference_id: [orders.responseOrderId],
                        action_id: action == "ndr" ? "1" : "2",
                        comments: action == "ndr" ? "Reattempt requested" : "RTO Requested",
                        next_attempt_date: action == "ndr" ? nextAttemptDate : "",
                        address: (data === null || data === void 0 ? void 0 : data.address) || ((_a = orders.customerAddress) === null || _a === void 0 ? void 0 : _a.address) || "",
                        phone: (data === null || data === void 0 ? void 0 : data.phone) || ((_b = orders.customerAddress) === null || _b === void 0 ? void 0 : _b.contactNumber) || "",
                        names: ((_c = orders.customerAddress) === null || _c === void 0 ? void 0 : _c.fullName) || "",
                        alternate_address: ((_d = orders.customerAddress) === null || _d === void 0 ? void 0 : _d.address) || "",
                        alternate_number: ((_e = orders.customerAddress) === null || _e === void 0 ? void 0 : _e.contactNumber) || ""
                    }
                ]
            };
            console.log("Smartship NDR request body:", JSON.stringify(requestBody));
            try {
                const response = yield axios_1.default.post("http://api.smartship.in/v2/app/Fulfillmentservice/orderReattempt", requestBody, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                });
                console.log("Smartship NDR Response:", JSON.stringify(response.data));
                if (response.data && response.data.status === 1 && response.data.code === 200) {
                    if (response.data.data &&
                        response.data.data.success_orders &&
                        response.data.data.success_orders.length > 0) {
                        if (data.address || data.phone) {
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
                            message: "Smartship NDR reattempt created successfully",
                            data: response.data.data.success_orders[0]
                        };
                    }
                    else if (response.data.data &&
                        response.data.data.errors &&
                        response.data.data.errors.length > 0) {
                        const errorData = response.data.data.errors[0];
                        return {
                            success: false,
                            error: errorData.error || "Failed to create Smartship NDR"
                        };
                    }
                }
                return {
                    success: false,
                    error: ((_f = response.data) === null || _f === void 0 ? void 0 : _f.message) || "Invalid response format from Smartship API"
                };
            }
            catch (apiError) {
                if (axios_1.default.isAxiosError(apiError) && apiError.response) {
                    console.error("Smartship API Error:", {
                        status: apiError.response.status,
                        statusText: apiError.response.statusText,
                        data: apiError.response.data
                    });
                    if (((_h = (_g = apiError.response.data) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.errors) &&
                        apiError.response.data.data.errors.length > 0) {
                        const errorDetail = apiError.response.data.data.errors[0];
                        return {
                            success: false,
                            error: errorDetail.error || "API error"
                        };
                    }
                    const errorMessage = ((_j = apiError.response.data) === null || _j === void 0 ? void 0 : _j.message) ||
                        ((_k = apiError.response.data) === null || _k === void 0 ? void 0 : _k.error) ||
                        "Error from Smartship API";
                    return { success: false, error: errorMessage };
                }
                if (apiError instanceof Error) {
                    return { success: false, error: apiError.message };
                }
                return { success: false, error: "Unknown error occurred while creating Smartship NDR" };
            }
        }
        catch (error) {
            console.error("Error in createSmartshipNdr:", error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                if (((_m = (_l = error.response.data) === null || _l === void 0 ? void 0 : _l.data) === null || _m === void 0 ? void 0 : _m.errors) &&
                    error.response.data.data.errors.length > 0) {
                    const errorDetail = error.response.data.data.errors[0];
                    return {
                        success: false,
                        error: errorDetail.error || ((_o = error.response.data) === null || _o === void 0 ? void 0 : _o.message) || 'API error'
                    };
                }
                return {
                    success: false,
                    error: ((_p = error.response.data) === null || _p === void 0 ? void 0 : _p.message) || 'Unknown API error'
                };
            }
            if (error instanceof Error) {
                return { success: false, error: error.message };
            }
            return {
                success: false,
                error: "An unexpected error occurred while creating Smartship NDR request"
            };
        }
    });
}
