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
exports.cancelDelhiveryOrder = cancelDelhiveryOrder;
exports.createDelhiveryOrder = createDelhiveryOrder;
exports.createDelhiveryReverseOrder = createDelhiveryReverseOrder;
exports.createDelhiveryNdr = createDelhiveryNdr;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
// import DeliveryPartnerModal from "@/components/UserAdmin/testing/DeliveryPartnerModal";
const tokenManager_1 = require("./tokenManager");
const prisma_1 = __importDefault(require("../../lib/prisma"));
let token;
function getToken(type) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Getting token for type:", type);
        try {
            switch (type.toLowerCase()) {
                case "delhivery":
                    token = yield (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery");
                    break;
                case "delhivery 5kg":
                    token = yield (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery5kg");
                    break;
                case "delhivery 10kg":
                    token = yield (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery10kg");
                    break;
                case "delhivery 20kg":
                    token = yield (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery20kg");
                    break;
                case "delhivery air":
                    token = yield (0, tokenManager_1.getDeliveryPartnerToken)("DelhiveryAir");
                    break;
                case "delhivery reverse":
                    token = yield (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery");
                    break;
                default:
                    console.error(`No token found for type: ${type} `);
            }
            if (!token) {
                console.error(`Token is undefined for type: ${type}`);
            }
            console.log("Token successfully retrieved:", token.substring(0, 10) + "...");
            return token;
        }
        catch (error) {
            console.error("Error in getToken:", error);
            return error instanceof Error ? error.message : String(error);
        }
    });
}
function generateRandomOrderId(orderId) {
    const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `${orderId}-${randomNum}`;
}
function cancelDelhiveryOrder(awbNumber, type) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("awbNumber line no. 232:", awbNumber);
            const token = yield getToken(type);
            const data = {
                waybill: awbNumber,
                cancellation: true,
            };
            const jsonData = JSON.stringify(data);
            const requestBody = jsonData;
            const response = yield axios_1.default.post("https://track.delhivery.com/api/p/edit", requestBody, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Token ${token}`,
                },
            });
            console.log("Cancellation Response from Delhivery line 254:", response.data);
            if (response.data.status === true) {
                const order = yield prisma_1.default.orders.findUnique({
                    where: { awbNumber: awbNumber },
                });
                if (!order) {
                    console.error(`Order with AWB number ${awbNumber} not found in the database.`);
                    return { success: false, message: "Order not found in the database" };
                }
                console.log(`Order with AWB number ${awbNumber} has been successfully cancelled.`);
                // revalidateTag('orders');
                return { success: true, message: "Order cancelled successfully" };
            }
            else {
                console.error("Failed to cancel order:", response.status);
                return { success: false, message: "Order cancellation unsuccessfully" };
            }
        }
        catch (error) {
            console.error("Error cancelling order:", error);
            return {
                success: false,
                message: "An unexpected error occurred. Please try again.",
            };
        }
    });
}
function createDelhiveryOrder(orderId, mode, type) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
        try {
            console.log("Starting createDelhiveryOrder for orderId:", orderId);
            const token = yield getToken(type);
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
                return { success: false, message: "Order not found" };
            }
            const warehouseAddress = yield prisma_1.default.address.findUnique({
                where: { id: (_a = order.agentAddressId) !== null && _a !== void 0 ? _a : undefined },
            });
            const rtoWarehouseAddress = yield prisma_1.default.address.findUnique({
                where: { id: (_b = order.rtoAgentAddressId) !== null && _b !== void 0 ? _b : undefined },
            });
            if (!warehouseAddress || !rtoWarehouseAddress) {
                console.error("Warehouse address or RTO warehouse address not found");
                return { success: false, message: "Warehouse address not found" };
            }
            const warehouseDetails = {
                name: warehouseAddress.tag,
                email: warehouseAddress.email || "default@example.com",
                phone: warehouseAddress.contactNumber,
                address: warehouseAddress.address,
                city: warehouseAddress.city,
                country: "India",
                pin: warehouseAddress.pincode.toString(),
                return_address: rtoWarehouseAddress.address,
                return_pin: rtoWarehouseAddress.pincode.toString(),
                return_city: rtoWarehouseAddress.city,
                return_state: rtoWarehouseAddress.state,
                return_country: "India",
            };
            try {
                const warehouseResponse = yield axios_1.default.post("https://track.delhivery.com/api/backend/clientwarehouse/create/", warehouseDetails, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Token ${token}`,
                    },
                });
                if (warehouseResponse.data.success) {
                    console.log("Warehouse creation successful");
                }
                else {
                    if (warehouseResponse.data.error &&
                        ((_c = warehouseResponse.data.error[0]) === null || _c === void 0 ? void 0 : _c.includes("already exists"))) {
                        console.log("Warehouse already exists");
                    }
                    else {
                        console.error("Failed to create warehouse:", warehouseResponse.data.error);
                    }
                }
            }
            catch (warehouseError) {
                console.warn("Warehouse creation failed, proceeding with existing warehouse:", warehouseError);
            }
            const shipmentData = {
                shipments: [
                    {
                        name: (_e = (_d = order.customerAddress) === null || _d === void 0 ? void 0 : _d.fullName) !== null && _e !== void 0 ? _e : "",
                        add: (_g = (_f = order.customerAddress) === null || _f === void 0 ? void 0 : _f.address) !== null && _g !== void 0 ? _g : "",
                        pin: (_k = (_j = (_h = order.customerAddress) === null || _h === void 0 ? void 0 : _h.pincode) === null || _j === void 0 ? void 0 : _j.toString()) !== null && _k !== void 0 ? _k : "",
                        city: (_m = (_l = order.customerAddress) === null || _l === void 0 ? void 0 : _l.city) !== null && _m !== void 0 ? _m : "",
                        state: (_p = (_o = order.customerAddress) === null || _o === void 0 ? void 0 : _o.state) !== null && _p !== void 0 ? _p : "",
                        country: "India",
                        phone: (_r = (_q = order.customerAddress) === null || _q === void 0 ? void 0 : _q.contactNumber) !== null && _r !== void 0 ? _r : "",
                        order: generateRandomOrderId(order.orderId),
                        payment_mode: ((_s = order.paymentMode) === null || _s === void 0 ? void 0 : _s.toUpperCase()) || "",
                        return_pin: (_u = (_t = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.pincode) === null || _t === void 0 ? void 0 : _t.toString()) !== null && _u !== void 0 ? _u : "",
                        return_city: (_v = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.city) !== null && _v !== void 0 ? _v : "",
                        return_phone: (_w = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.contactNumber) !== null && _w !== void 0 ? _w : "",
                        return_add: (_x = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.address) !== null && _x !== void 0 ? _x : "",
                        return_state: (_y = rtoWarehouseAddress === null || rtoWarehouseAddress === void 0 ? void 0 : rtoWarehouseAddress.state) !== null && _y !== void 0 ? _y : "",
                        return_country: "India",
                        products_desc: "",
                        cod_amount: ((_z = order.paymentMode) === null || _z === void 0 ? void 0 : _z.toLowerCase()) === "cod"
                            ? (_1 = (_0 = order.totalOrderValue) === null || _0 === void 0 ? void 0 : _0.toString()) !== null && _1 !== void 0 ? _1 : "0"
                            : "0",
                        total_amount: (_3 = (_2 = order.totalOrderValue) === null || _2 === void 0 ? void 0 : _2.toString()) !== null && _3 !== void 0 ? _3 : "0",
                        seller_add: warehouseAddress.address,
                        seller_name: ((_4 = order === null || order === void 0 ? void 0 : order.Users) === null || _4 === void 0 ? void 0 : _4.StoreName) || warehouseAddress.tag,
                        shipment_width: ((_5 = order.breadth) === null || _5 === void 0 ? void 0 : _5.toString()) || "",
                        shipment_height: ((_6 = order.height) === null || _6 === void 0 ? void 0 : _6.toString()) || "",
                        weight: ((_7 = order.applicableWeight) === null || _7 === void 0 ? void 0 : _7.toString()) || "",
                        shipping_mode: mode === "surface" ? "Surface" : "Express",
                    },
                ],
                pickup_location: {
                    name: warehouseAddress.tag,
                    add: warehouseAddress.address,
                    city: warehouseAddress.city,
                    pin_code: warehouseAddress.pincode,
                    country: "India",
                    phone: warehouseAddress.contactNumber,
                },
            };
            console.log(shipmentData);
            const jsonData = JSON.stringify(shipmentData);
            const requestBody = `format=json&data=${encodeURIComponent(jsonData)}`;
            const response = yield axios_1.default.post("https://track.delhivery.com/api/cmu/create.json", requestBody, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json",
                    Authorization: `Token ${token}`,
                },
            });
            console.log(JSON.stringify(requestBody), "requestBody for delhivery");
            console.log(JSON.stringify({
                message: "Delhivery API response:",
                responseData: response.data,
                path: "deliveryPartners/delhivery.js",
            }, null, 2));
            if (response.data && response.data.packages && response.data.packages[0]) {
                if (response.data.packages[0].status !== "Fail") {
                    const awbNumber = response.data.packages[0].waybill;
                    const updatedOrder = yield prisma_1.default.orders.update({
                        where: { id: orderId },
                        data: {
                            status: client_1.OrderStatus.READY_TO_SHIP,
                            awbNumber: awbNumber,
                        },
                    });
                    return { success: true, awbNumber };
                }
                else {
                    if (response.data.packages[0].serviceable === false) {
                        console.error("Pincode is not serviceable");
                        return { success: false, message: "Pincode is not serviceable" };
                    }
                    else if (response.data.packages[0].sort_code === "BAN/EEN") {
                        console.error(":Warehouse is banned, choose a different warehouse to proceed");
                        return {
                            success: false,
                            error: ":Warehouse is banned, choose a different warehouse to proceed",
                        };
                    }
                    else {
                        console.error(JSON.stringify({
                            message: `Failed to create Delhivery order: ${response.data.packages[0].status}`,
                            path: "deliveryPartners/delhivery.js",
                        }));
                        return {
                            success: false,
                            message: "Failed to create Delhivery order",
                        };
                    }
                }
            }
            else {
                console.error("Unexpected response format from Delhivery API");
                return {
                    success: false,
                    message: "Unexpected response format from Delhivery API",
                };
            }
        }
        catch (error) {
            console.error(JSON.stringify({
                message: "Error creating Delhivery shipment:",
                errorDetails: error,
                path: "deliveryPartners/delhivery.js",
            }));
            if (error instanceof Error) {
                return { success: false, error: error.message };
            }
            else {
                return { success: false, error: "An unknown error occurred" };
            }
        }
    });
}
function createDelhiveryReverseOrder(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        try {
            console.log("Starting createDelhiveryReverseOrder for orderId:", orderId);
            const token = yield (0, tokenManager_1.getDeliveryPartnerToken)("Delhivery");
            const order = yield prisma_1.default.orders.findUnique({
                where: { id: orderId },
                include: {
                    reverseCustomerAddress: true,
                    ReversePickupAddress: true,
                    Users: true,
                },
            });
            if (!order) {
                return {
                    success: false,
                    error: `Order not found for orderId: ${orderId}`,
                };
            }
            console.log("Order details:", JSON.stringify(order, null, 2));
            const reverseCustomerAddress = order.reverseCustomerAddress;
            const reversePickupAddress = order.ReversePickupAddress;
            if (!reversePickupAddress || !reverseCustomerAddress) {
                return {
                    success: false,
                    error: "ReversePickupAddress or reverseCustomerAddress not found",
                };
            }
            const warehouseDetails = {
                name: reverseCustomerAddress.tag,
                email: reverseCustomerAddress.email || "default@example.com",
                phone: reverseCustomerAddress.contactNumber,
                address: reverseCustomerAddress.address,
                city: reverseCustomerAddress.city,
                country: "India",
                pin: reverseCustomerAddress.pincode.toString(),
                return_address: reversePickupAddress.address,
                return_pin: reversePickupAddress.pincode.toString(),
                return_city: reversePickupAddress.city,
                return_state: reversePickupAddress.state,
                return_country: "India",
            };
            // console.log("Warehouse creation started");
            // console.log("warehouseDetails : ", warehouseDetails);
            try {
                const warehouseResponse = yield axios_1.default.post("https://track.delhivery.com/api/backend/clientwarehouse/create/", warehouseDetails, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Token ${token}`,
                    },
                });
                if (warehouseResponse.data.success) {
                    console.log("Warehouse creation successful");
                }
                else {
                    if (warehouseResponse.data.error &&
                        ((_a = warehouseResponse.data.error[0]) === null || _a === void 0 ? void 0 : _a.includes("already exists"))) {
                        console.log("Warehouse already exists");
                    }
                    else {
                        console.error("Failed to create warehouse:", warehouseResponse.data.error);
                    }
                }
            }
            catch (warehouseError) {
                console.warn("Warehouse creation failed, proceeding with existing warehouse:", warehouseError);
            }
            const shipmentData = {
                shipments: [
                    {
                        name: reversePickupAddress.fullName,
                        add: reversePickupAddress.address,
                        pin: reversePickupAddress.pincode.toString(),
                        city: reversePickupAddress.city,
                        state: reversePickupAddress.state,
                        country: "India",
                        phone: reversePickupAddress.contactNumber,
                        order: generateRandomOrderId(order.orderId),
                        payment_mode: "Pickup",
                        return_pin: reverseCustomerAddress.pincode.toString(),
                        return_city: reverseCustomerAddress.city,
                        return_phone: reverseCustomerAddress.contactNumber,
                        return_add: reverseCustomerAddress.address,
                        return_state: reverseCustomerAddress.state,
                        return_country: "India",
                        cod_amount: ((_b = order.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "cod"
                            ? (_d = (_c = order.totalOrderValue) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : "0"
                            : "0",
                        total_amount: (_f = (_e = order.totalOrderValue) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : "0",
                        shipment_width: ((_g = order.breadth) === null || _g === void 0 ? void 0 : _g.toString()) || "",
                        shipment_height: ((_h = order.height) === null || _h === void 0 ? void 0 : _h.toString()) || "",
                        weight: ((_j = order.applicableWeight) === null || _j === void 0 ? void 0 : _j.toString()) || "",
                        shipping_mode: order.shippingMode || "Surface",
                    },
                ],
                pickup_location: {
                    name: reverseCustomerAddress.tag,
                    add: reverseCustomerAddress.address,
                    city: reverseCustomerAddress.city,
                    pin_code: reverseCustomerAddress.pincode,
                    country: "India",
                    phone: reverseCustomerAddress.contactNumber,
                },
            };
            const jsonData = JSON.stringify(shipmentData);
            const requestBody = `format=json&data=${encodeURIComponent(jsonData)}`;
            //   console.log("Delhivery API request body:", requestBody);
            const response = yield axios_1.default.post("https://track.delhivery.com/api/cmu/create.json", requestBody, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json",
                    Authorization: `Token ${token}`,
                },
            });
            console.log(JSON.stringify({
                data: "Delhivery API response:",
                responseData: response.data,
                path: "deliveryPartner/delhivery",
            }));
            if (response.data.success &&
                response.data.packages &&
                ((_k = response.data.packages[0]) === null || _k === void 0 ? void 0 : _k.status) !== "Fail") {
                const awbNumber = response.data.packages[0].waybill;
                const updatedOrder = yield prisma_1.default.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                    const updatedOrder = yield prisma.orders.update({
                        where: { id: order.id },
                        data: {
                            status: client_1.OrderStatus.READY_TO_SHIP,
                            awbNumber: awbNumber,
                        },
                    });
                    return updatedOrder;
                }));
                //   console.log("Reverse order updated with AWB number:", updatedOrder);
                // revalidatePath("/orders");
                const safeToNumber = (value) => {
                    return value ? value.toNumber() : null;
                };
                return {
                    success: true,
                    order: Object.assign(Object.assign({}, updatedOrder), { deadWeight: safeToNumber(updatedOrder.deadWeight), breadth: safeToNumber(updatedOrder.breadth), height: safeToNumber(updatedOrder.height), length: safeToNumber(updatedOrder.length), applicableWeight: safeToNumber(updatedOrder.applicableWeight), totalOrderValue: safeToNumber(updatedOrder.totalOrderValue) }),
                    awbNumber: awbNumber,
                };
            }
            else {
                const remarks = ((_m = (_l = response.data.packages) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.remarks) || JSON.stringify(response.data);
                return {
                    success: false,
                    error: remarks,
                    details: response.data,
                };
            }
        }
        catch (error) {
            console.error(JSON.stringify({
                data: "Error in createDelhiveryReverseOrder:",
                error,
                path: "deliveryPartner/delhivery",
            }));
            // If it's an API error response containing the remarks
            if (axios_1.default.isAxiosError(error) &&
                ((_r = (_q = (_p = (_o = error.response) === null || _o === void 0 ? void 0 : _o.data) === null || _p === void 0 ? void 0 : _p.packages) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.remarks)) {
                const remarks = error.response.data.packages[0].remarks;
                return { success: false, error: remarks };
            }
            // Default error handling
            if (error instanceof Error) {
                return { success: false, error: error.message };
            }
            return {
                success: false,
                error: "An unexpected error occurred while creating Delhivery reverse order",
            };
        }
    });
}
function createDelhiveryNdr(order, data, type) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting createDelhiveryNdr for order:", order);
        console.log("Data:", data);
        try {
            const token = yield getToken(order.DeliveryPartner.partnerName);
            console.log("Token:", token);
            const orders = yield prisma_1.default.orders.findUnique({
                where: { orderId: Number(order.orderId) },
                include: {
                    customerAddress: true,
                },
            });
            ;
            if (!orders) {
                return { success: false, error: "Order not found" };
            }
            // Check if we're doing a re-attempt only or editing + re-attempt
            const isReAttemptOnly = JSON.stringify(data) === "{}";
            // If data contains updates, edit the shipment first
            if (!isReAttemptOnly) {
                const editResult = yield editShipmentDetails(orders, data, token);
                if (!editResult.success) {
                    return editResult;
                }
            }
            // Perform re-attempt request
            const reattemptResult = yield requestReAttempt(order.awbNumber, token);
            if (!reattemptResult.success) {
                return reattemptResult;
            }
            // Update customer address in database if needed
            if (data.address || data.phone) {
                yield updateCustomerAddressInDb(orders, data);
            }
            return { success: true, message: "NDR created successfully" };
        }
        catch (error) {
            return handleApiError(error, "createDelhiveryNdr");
        }
    });
}
function editShipmentDetails(orders, data, token) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        console.log("Starting editShipmentDetails for order:", orders);
        const requestBody = {
            waybill: orders.awbNumber,
            phone: (data === null || data === void 0 ? void 0 : data.phone) || "",
            name: "",
            add: (data === null || data === void 0 ? void 0 : data.address) || "",
            product_details: "",
            shipment_length: parseFloat(((orders === null || orders === void 0 ? void 0 : orders.length) || 0).toFixed(1)) + 0.1,
            shipment_width: parseFloat(((orders === null || orders === void 0 ? void 0 : orders.breadth) || 0).toFixed(1)) + 0.1,
            shipment_height: parseFloat(((orders === null || orders === void 0 ? void 0 : orders.height) || 0).toFixed(1)) + 0.1,
            weight: parseFloat(((orders === null || orders === void 0 ? void 0 : orders.applicableWeight) || 0).toFixed(1)) + 0.0,
        };
        console.log("Request body for NDR edit:", requestBody);
        try {
            const editResponse = yield axios_1.default.post("https://track.delhivery.com/api/p/edit", requestBody, {
                headers: getRequestHeaders(token),
            });
            console.log("NDR Edit Response from Delhivery:", editResponse.data);
            console.log("NDR Response from Delhivery:", editResponse.data.status);
            if (((_a = editResponse.data) === null || _a === void 0 ? void 0 : _a.status) == "Failure") {
                return {
                    success: false,
                    error: ((_b = editResponse.data) === null || _b === void 0 ? void 0 : _b.message) ||
                        ((_c = editResponse.data) === null || _c === void 0 ? void 0 : _c.error) ||
                        "Failed to edit shipment details",
                };
            }
            return { success: true };
        }
        catch (error) {
            return handleApiError(error, "editShipmentDetails");
        }
    });
}
function requestReAttempt(awbNumber, token) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const updateRequestBody = {
            data: [
                {
                    waybill: awbNumber,
                    act: "RE-ATTEMPT",
                },
            ],
        };
        console.log("Request body for NDR re-attempt:", updateRequestBody);
        try {
            const updateResponse = yield axios_1.default.post("https://track.delhivery.com/api/p/update", updateRequestBody, {
                headers: getRequestHeaders(token),
            });
            console.log("Update response:", updateResponse.data);
            if (((_a = updateResponse.data) === null || _a === void 0 ? void 0 : _a.request_id) && !updateResponse.data.error) {
                return { success: true };
            }
            return {
                success: false,
                error: ((_b = updateResponse.data) === null || _b === void 0 ? void 0 : _b.message) ||
                    ((_c = updateResponse.data) === null || _c === void 0 ? void 0 : _c.error) ||
                    "Failed to create NDR",
            };
        }
        catch (error) {
            return handleApiError(error, "requestReAttempt");
        }
    });
}
function updateCustomerAddressInDb(orders, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const customerId = orders.forwardCustomerId || orders.reverseCustomerId;
            if (!customerId) {
                console.log("No valid customer ID found for address update");
                return;
            }
            console.log(`Updating ${orders.forwardCustomerId ? "forward" : "reverse"} customer address`);
            yield prisma_1.default.customerAddress.update({
                where: {
                    customerId,
                },
                data: {
                    address: data.address || undefined,
                    contactNumber: data.phone || undefined,
                },
            });
        }
        catch (dbError) {
            console.error("Error updating customer address:", dbError);
        }
    });
}
function getRequestHeaders(token) {
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${token}`,
    };
}
function handleApiError(error, source) {
    var _a, _b, _c;
    if (axios_1.default.isAxiosError(error) && error.response) {
        console.error(`Error in ${source}:`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
        });
        const errorMessage = ((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.message) ||
            ((_b = error.response.data) === null || _b === void 0 ? void 0 : _b.error) ||
            ((_c = error.response.data) === null || _c === void 0 ? void 0 : _c.detail) ||
            "Error from Delhivery API";
        return {
            success: false,
            error: `Delhivery API error: ${errorMessage} (${error.response.status})`,
        };
    }
    if (error instanceof Error) {
        console.error(`Error in ${source}:`, error);
        return { success: false, error: error.message };
    }
    console.error(`Unexpected error in ${source}:`, error);
    return {
        success: false,
        error: `An unexpected error occurred in ${source}`,
    };
}
