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
exports.CreateReverseEcomOrder = CreateReverseEcomOrder;
exports.cancelEcomOrder = cancelEcomOrder;
exports.createForwardEcomOrder = createForwardEcomOrder;
exports.CancelForwardEcom = CancelForwardEcom;
exports.createEcomExpressNdr = createEcomExpressNdr;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../lib/prisma"));
function CreateReverseEcomOrder(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            console.log("Inside Ecom");
            const responseOrderId = orderId + Math.floor(100 + Math.random() * 900).toString();
            const order = yield prisma_1.default.orders.findUnique({
                where: { id: orderId },
                include: {
                    reverseCustomerAddress: true,
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
                console.error("Warehouse address or RTO warehouse address not found");
                return {
                    success: false,
                    error: "Warehouse address or RTO warehouse address not found",
                };
            }
            const customerAddress = yield prisma_1.default.address.findFirst({
                where: {
                    id: order.reverseCustomerId || undefined,
                },
            });
            if (!customerAddress) {
                console.error("Customer address not found");
                return { success: false, error: "Customer address not found" };
            }
            const collectableAmount = 0;
            // Generate AWB
            const awbParams = new URLSearchParams();
            awbParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED-EXSPLUS713662");
            awbParams.append("password", "Hqd324rJo7");
            awbParams.append("count", "1");
            awbParams.append("type", "EXPP");
            const awbResponse = yield axios_1.default.post("https://Shipment.ecomexpress.in/services/shipment/products/v2/fetch_awb/", awbParams);
            if (awbResponse.data.success !== "yes") {
                console.error("Failed to generate AWB");
            }
            const awb = awbResponse.data.awb;
            // Create product string with payment mode
            const paymentMode = collectableAmount > 0 ? "COD" : "PPD";
            // Create item description with product name and image
            const itemDescription = order.Packages
                .map((pkg) => {
                const productInfo = [];
                if (pkg.productName)
                    productInfo.push(pkg.productName);
                if (pkg.image)
                    productInfo.push(`Image: ${pkg.image}`);
                return productInfo.join(" - ");
            })
                .filter(Boolean)
                .join(", ");
            // Determine if it's an essential product based on category
            const isEssentialProduct = ((_a = order.Packages[0]) === null || _a === void 0 ? void 0 : _a.category) === "BabyAndToddler" ||
                ((_b = order.Packages[0]) === null || _b === void 0 ? void 0 : _b.category) === "GroceryAndGourmetFood" ||
                ((_c = order.Packages[0]) === null || _c === void 0 ? void 0 : _c.category) === "HealthAndHousehold"
                ? "Y"
                : "N";
            // Create manifest
            const manifestParams = new URLSearchParams();
            manifestParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED-EXSPLUS713662");
            manifestParams.append("password", "Hqd324rJo7");
            manifestParams.append("json_input", JSON.stringify([
                {
                    AWB_NUMBER: awb.toString(),
                    ORDER_NUMBER: responseOrderId,
                    PRODUCT: paymentMode,
                    CONSIGNEE: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.fullName,
                    CONSIGNEE_ADDRESS1: pickupAddress === null || pickupAddress === void 0 ? void 0 : pickupAddress.address,
                    DESTINATION_CITY: pickupAddress.city,
                    STATE: pickupAddress.state,
                    PINCODE: pickupAddress.pincode.toString(),
                    TELEPHONE: pickupAddress.contactNumber,
                    MOBILE: pickupAddress.contactNumber,
                    RETURN_NAME: ((_d = order === null || order === void 0 ? void 0 : order.Users) === null || _d === void 0 ? void 0 : _d.StoreName) || customerAddress.tag,
                    RETURN_MOBILE: customerAddress.contactNumber,
                    RETURN_PINCODE: customerAddress.pincode.toString(),
                    RETURN_ADDRESS_LINE1: customerAddress.address,
                    RETURN_PHONE: customerAddress.alternateNumber,
                    PICKUP_NAME: pickupAddress.fullName,
                    PICKUP_PINCODE: pickupAddress.pincode.toString(),
                    PICKUP_MOBILE: pickupAddress.contactNumber,
                    PICKUP_PHONE: pickupAddress.alternateNumber,
                    PICKUP_ADDRESS_LINE1: pickupAddress.address,
                    COLLECTABLE_VALUE: collectableAmount === null || collectableAmount === void 0 ? void 0 : collectableAmount.toString(),
                    DECLARED_VALUE: (_e = order.totalOrderValue) === null || _e === void 0 ? void 0 : _e.toString(),
                    ITEM_DESCRIPTION: itemDescription,
                    DG_SHIPMENT: order.isDangerous ? "Y" : "N",
                    PIECES: order.Packages.length,
                    LENGTH: order.length + ".0",
                    BREADTH: order.breadth + ".0",
                    HEIGHT: order.height + ".0",
                    VOLUMETRIC_WEIGHT: Number(order.deadWeight),
                    ACTUAL_WEIGHT: Number(order.applicableWeight),
                    ADDITIONAL_INFORMATION: [{}],
                    GST_TAX_RATE_SGSTN: 0,
                    GST_TAX_IGSTN: 0,
                    DISCOUNT: 0,
                    GST_TAX_RATE_IGSTN: 0,
                    GST_TAX_BASE: 0,
                    GST_TAX_SGSTN: 0,
                    INVOICE_DATE: customerAddress.createdAt,
                    SELLER_GSTIN: "",
                    GST_TAX_RATE_CGSTN: 0,
                    GST_HSN: ((_f = order.Packages[0]) === null || _f === void 0 ? void 0 : _f.hsn) || "",
                    GST_TAX_NAME: "",
                    INVOICE_NUMBER: "0",
                    GST_TAX_TOTAL: 1,
                    GST_TAX_CGSTN: 0,
                    GST_ERN: "0",
                    ESSENTIAL_PRODUCT: isEssentialProduct,
                    CONSIGNEE_LAT: "0",
                    CONSIGNEE_LONG: "0",
                },
            ]));
            const manifestResponse = yield axios_1.default.post("https://shipment.ecomexpress.in/services/expp/manifest/v2/expplus/", manifestParams);
            console.log("manifest params:", manifestParams);
            //  console.log('manifest response:', manifestResponse.data.shipments[0]);
            // Check if the manifest response contains a successful shipment
            const successfulShipment = (_g = manifestResponse.data.shipments) === null || _g === void 0 ? void 0 : _g[0];
            if (!successfulShipment || !successfulShipment.success) {
                console.error((successfulShipment === null || successfulShipment === void 0 ? void 0 : successfulShipment.reason) || "Manifest creation failed");
            }
            // Only log and update if successful
            //   console.log("AWB generated:", awb);
            //  console.log("Manifest created successfully", manifestResponse.data);
            const updatedOrder = yield prisma_1.default.orders.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.READY_TO_SHIP,
                    awbNumber: awb.toString(),
                    shippingDate: new Date(),
                },
            });
            // revalidatePath("/orders");
            const safeToNumber = (value) => {
                return value ? value.toNumber() : null;
            };
            return {
                success: true,
                order: Object.assign(Object.assign({}, updatedOrder), { deadWeight: safeToNumber(updatedOrder.deadWeight), breadth: safeToNumber(updatedOrder.breadth), height: safeToNumber(updatedOrder.height), length: safeToNumber(updatedOrder.length), applicableWeight: safeToNumber(updatedOrder.applicableWeight), totalOrderValue: safeToNumber(updatedOrder.totalOrderValue) }),
                awbNumber: awb.toString(),
            };
        }
        catch (error) {
            console.error(JSON.stringify({
                message: "Error in CreateReverseEcomOrder:",
                errorDetails: error,
                path: "deliverypartner/ecom",
            }));
            let errorMessage = "An unknown error occurred";
            if (error.response) {
                errorMessage =
                    error.response.data.message || "Unknown API error occurred";
            }
            else if (error.request) {
                errorMessage = "No response received from the server.";
            }
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            return { success: false, error: errorMessage };
        }
    });
}
function cancelEcomOrder(awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // console.log("awb",awbNumber);
            const params = new URLSearchParams();
            params.append("username", "SHYPBUDDYINDIAPRIVATELIMITED-EXSPLUS713662");
            params.append("password", "Hqd324rJo7");
            params.append("awbs", awbNumber);
            //  console.log("cancel params: ", params);
            const response = yield axios_1.default.post("https://api.ecomexpress.in/apiv2/cancel_awb/", params);
            // console.log("Order cancellation response:", response.data);
            if (response.data[0].success == true ||
                response.data[0].reason ==
                    "Shipment Cannot Be Cancelled As RTO Lock Already Applied") {
                console.log(`Order with AWB number ${awbNumber} has been successfully cancelled.`);
                return { success: true, message: "Order was successfully canceled" };
            }
            return { success: false, message: "Order cancellation failed" };
        }
        catch (error) {
            console.error(JSON.stringify({
                message: "Error cancelling Ecom order:",
                errorDetails: error,
                path: "deliverypartner/ecom",
            }));
            if (error.response && error.response.data) {
                console.error(JSON.stringify({
                    message: "Error cancelling Ecom order:",
                    errorDetails: error.response.data,
                    path: "deliverypartner/ecom",
                }));
            }
            return { success: false, message: "Failed to cancel Ecom order" };
        }
    });
}
function generateRandomOrderId(orderId) {
    const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `${orderId}-${randomNum}`;
}
function createForwardEcomOrder(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        try {
            console.log("Inside Forward Ecom Order Creation");
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
                return { success: false, message: "Order not found" };
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
                    message: "Warehouse address or RTO warehouse address not found",
                };
            }
            const customerAddress = order.customerAddress;
            if (!customerAddress) {
                console.error("Customer address not found");
                return { success: false, message: "Customer address not found" };
            }
            // Determine if it's a heavy weight shipment (>5 KG)
            const isHeavyWeight = Number(order.applicableWeight) > 5;
            // Determine AWB type based on payment mode and weight
            let awbType;
            awbType = ((_b = order.paymentMode) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "prepaid" ? "PPD" : "COD";
            const collectableAmount = ((_c = order.paymentMode) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === "prepaid"
                ? 0
                : order.totalOrderValue;
            // Format product names for ITEM_DESCRIPTION
            const productNames = order.Packages.map((pkg) => pkg.productName)
                .filter(Boolean)
                .join(", ");
            const hsn = order.Packages.map((pkg) => pkg.hsn)
                .filter(Boolean)
                .join(", ");
            const orderCategory = (_d = order.Packages[0]) === null || _d === void 0 ? void 0 : _d.category;
            // Determine if it's an essential product based on category
            const isEssentialProduct = orderCategory === "BabyAndToddler" ||
                "GroceryAndGourmetFood" ||
                "HealthAndHousehold"
                ? "Y"
                : "N";
            // Fetch AWB number
            const awbParams = new URLSearchParams();
            awbParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
            awbParams.append("password", "w5kzZECMxO");
            awbParams.append("count", "1");
            awbParams.append("type", awbType);
            const awbResponse = yield axios_1.default.post("https://api.ecomexpress.in/apiv2/fetch_awb/", awbParams);
            if (awbResponse.data.success !== "yes") {
                console.error("Failed to generate AWB");
            }
            const awb = awbResponse.data.awb;
            // Create manifest
            const manifestParams = new URLSearchParams();
            manifestParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
            manifestParams.append("password", "w5kzZECMxO");
            manifestParams.append("json_input", JSON.stringify([
                {
                    AWB_NUMBER: awb.toString(),
                    ORDER_NUMBER: generateRandomOrderId(order.orderId),
                    PRODUCT: awbType,
                    CONSIGNEE: customerAddress.fullName,
                    CONSIGNEE_ADDRESS1: customerAddress.address,
                    DESTINATION_CITY: customerAddress.city,
                    STATE: customerAddress.state,
                    PINCODE: customerAddress.pincode.toString(),
                    TELEPHONE: customerAddress.contactNumber,
                    MOBILE: customerAddress.contactNumber,
                    RETURN_NAME: ((_e = order === null || order === void 0 ? void 0 : order.Users) === null || _e === void 0 ? void 0 : _e.StoreName) || rtoWarehouseAddress.tag,
                    RETURN_MOBILE: rtoWarehouseAddress.contactNumber || warehouseAddress.contactNumber,
                    RETURN_PINCODE: rtoWarehouseAddress.pincode.toString() ||
                        warehouseAddress.pincode.toString(),
                    RETURN_ADDRESS_LINE1: rtoWarehouseAddress.address || warehouseAddress.address,
                    RETURN_PHONE: rtoWarehouseAddress.alternateNumber ||
                        warehouseAddress.alternateNumber,
                    PICKUP_NAME: ((_f = order === null || order === void 0 ? void 0 : order.Users) === null || _f === void 0 ? void 0 : _f.StoreName) || warehouseAddress.tag,
                    PICKUP_PINCODE: warehouseAddress.pincode.toString(),
                    PICKUP_MOBILE: warehouseAddress.contactNumber,
                    PICKUP_PHONE: warehouseAddress.alternateNumber,
                    PICKUP_ADDRESS_LINE1: warehouseAddress.address,
                    COLLECTABLE_VALUE: collectableAmount === null || collectableAmount === void 0 ? void 0 : collectableAmount.toString(),
                    DECLARED_VALUE: (_g = order.totalOrderValue) === null || _g === void 0 ? void 0 : _g.toString(),
                    ITEM_DESCRIPTION: productNames || "No items",
                    DG_SHIPMENT: order.isDangerous ? "Y" : "N",
                    PIECES: order.Packages.length,
                    LENGTH: order.length + ".0",
                    BREADTH: order.breadth + ".0",
                    HEIGHT: order.height + ".0",
                    VOLUMETRIC_WEIGHT: Number(order.deadWeight),
                    ACTUAL_WEIGHT: Number(order.applicableWeight),
                    ADDITIONAL_INFORMATION: {
                        GST_TAX_CGSTN: "0",
                        GST_TAX_IGSTN: "0",
                        GST_TAX_SGSTN: "0",
                        SELLER_GSTIN: "",
                        INVOICE_DATE: new Date().toLocaleDateString(),
                        INVOICE_NUMBER: order.orderId,
                        GST_TAX_RATE_SGSTN: "0",
                        GST_TAX_RATE_IGSTN: "0",
                        GST_TAX_RATE_CGSTN: "0",
                        GST_HSN: hsn || "NA",
                        GST_TAX_BASE: "0",
                        GST_TAX_NAME: "",
                        ESSENTIALPRODUCT: isEssentialProduct,
                        GST_TAX_TOTAL: "0",
                        CONSIGNEE_LONG: "0",
                        CONSIGNEE_LAT: "0",
                        what3words: "tall.basically.flattered",
                    },
                },
            ]));
            const manifestResponse = yield axios_1.default.post("https://api.ecomexpress.in/apiv2/manifest_awb/", manifestParams);
            console.log("hi", manifestResponse.data);
            const failedShipment = (_h = manifestResponse.data.shipments) === null || _h === void 0 ? void 0 : _h[0];
            if (!failedShipment || !failedShipment.success) {
                let errorReason = `Manifest creation failed for Order ID: ${orderId}`;
                // Extract specific error reason if available
                if (failedShipment && failedShipment.reason) {
                    errorReason = `Order ID ${orderId}: ${failedShipment.reason}`;
                }
            }
            // Check if the manifest response contains a successful shipment
            const successfulShipment = (_j = manifestResponse.data.shipments) === null || _j === void 0 ? void 0 : _j[0];
            if (!successfulShipment ||
                successfulShipment.success === false ||
                successfulShipment.reason === "CONSIGNEE_PINCODE_NOT_SERVICED") {
                console.error("Manifest creation failed");
                return { success: false, error: successfulShipment.reason };
            }
            // Only log and update if successful
            //  console.log("AWB generated:", awb);
            //    console.log("Manifest created successfully", manifestResponse.data);
            const updatedOrder = yield prisma_1.default.orders.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.READY_TO_SHIP,
                    awbNumber: awb.toString(),
                    shippingDate: new Date(),
                },
            });
            // revalidatePath("/orders");
            const safeToNumber = (value) => {
                return value ? value.toNumber() : null;
            };
            return {
                success: true,
                order: Object.assign(Object.assign({}, updatedOrder), { deadWeight: safeToNumber(updatedOrder.deadWeight), breadth: safeToNumber(updatedOrder.breadth), height: safeToNumber(updatedOrder.height), length: safeToNumber(updatedOrder.length), applicableWeight: safeToNumber(updatedOrder.applicableWeight), totalOrderValue: safeToNumber(updatedOrder.totalOrderValue) }),
                awbNumber: awb.toString(),
            };
        }
        catch (error) {
            console.error("Error in createForwardEcomOrder:", error);
            let errorMessage = "An unknown error occurred";
            if (error.response) {
                errorMessage =
                    error.response.data.message || "Unknown API error occurred";
            }
            else if (error.request) {
                errorMessage = "No response received from the server.";
            }
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            return { success: false, error: errorMessage };
        }
    });
}
function CancelForwardEcom(awbNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("In cancel for ecom");
            const cancelParams = new URLSearchParams();
            cancelParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
            cancelParams.append("password", "w5kzZECMxO");
            cancelParams.append("awbs", awbNumber);
            const cancelResponse = yield axios_1.default.post("https://api.ecomexpress.in/apiv2/cancel_awb/", cancelParams);
            const responseData = cancelResponse.data;
            if (Array.isArray(responseData) && responseData.length > 0) {
                const cancellationResult = responseData[0];
                if (cancellationResult.success === true ||
                    (cancellationResult.success === false &&
                        cancellationResult.reason === "INCORRECT_AIRWAYBILL_NUMBER") ||
                    "Shipment Cannot Be Cancelled As RTO Lock Already Applied") {
                    console.log(`AWB ${awbNumber} handled successfully`);
                    return {
                        success: true,
                        message: `AWB ${awbNumber} handled successfully. Reason: ${cancellationResult.reason}`,
                    };
                }
                else {
                    console.error(JSON.stringify({
                        message: `Failed to cancel AWB ${awbNumber}: ${cancellationResult.reason}`,
                        path: "deliverypartner/ecom",
                    }));
                    return {
                        success: false,
                        message: `Failed to cancel AWB ${awbNumber}: ${cancellationResult.reason}`,
                    };
                }
            }
            else {
                console.error("Unexpected response format from cancel AWB API");
                return {
                    success: false,
                    message: "Unexpected response format from cancel AWB API",
                };
            }
        }
        catch (error) {
            console.error(JSON.stringify({
                message: `Error cancelling AWB ${awbNumber}: ${error}`,
                path: "deliverypartner/ecom",
            }));
            return {
                success: false,
                message: `Error cancelling AWB ${awbNumber}.`,
            };
        }
    });
}
function createEcomExpressNdr(order, data, action) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting createEcomExpressNdr for AWB:", order.awbNumber);
        console.log("Data:", data);
        try {
            const orders = yield prisma_1.default.orders.findUnique({
                where: { orderId: Number(order.orderId) },
                include: {
                    customerAddress: true,
                },
            });
            if (!orders) {
                return { success: false, error: "Order not found" };
            }
            let instruction = "";
            if (action === "ndr") {
                instruction = "RAD";
            }
            else if (action === "rto") {
                instruction = "RTO";
            }
            else {
                return { success: false, error: "Invalid action specified" };
            }
            const ndrRequest = {
                awb: order.awbNumber,
                instruction: instruction,
                comments: action === "ndr" ? "Reattempt requested" : "RTO Requested"
            };
            if (action === "ndr") {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const formattedDate = tomorrow.toISOString().split('T')[0].replace(/-/g, '-');
                ndrRequest.scheduled_delivery_date = formattedDate;
                ndrRequest.scheduled_delivery_slot = "1"; // Default to slot 1
                if (data === null || data === void 0 ? void 0 : data.address) {
                    const addressLines = data.address.split('\n', 4);
                    ndrRequest.consignee_address = {
                        CA1: addressLines[0] || "",
                        CA2: addressLines[1] || "",
                        CA3: addressLines[2] || "",
                        CA4: addressLines[3] || ""
                    };
                }
                if (data === null || data === void 0 ? void 0 : data.phone) {
                    ndrRequest.mobile = data.phone;
                }
            }
            console.log("Ecom Express NDR request:", JSON.stringify([ndrRequest]));
            // Create form data
            const formData = new FormData();
            formData.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
            formData.append("password", "w5kzZECMxO");
            formData.append("json_input", JSON.stringify([ndrRequest]));
            try {
                const response = yield axios_1.default.post("https://api.ecomexpress.in/apiv2/ndr_resolutions/", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                });
                console.log("Ecom Express NDR Response:", JSON.stringify(response.data));
                let responseData = response.data;
                if (typeof responseData === 'string') {
                    try {
                        responseData = JSON.parse(responseData);
                    }
                    catch (parseError) {
                        console.error("Error parsing response data:", parseError);
                    }
                }
                if (Array.isArray(responseData) && responseData.length > 0) {
                    const responseItem = responseData[0];
                    if (responseItem.status === "true" || responseItem.success === true) {
                        if ((data.address || data.phone) && action === "ndr") {
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
                            message: `Ecom Express ${action === "ndr" ? "reattempt" : "RTO"} created successfully`,
                            data: responseItem
                        };
                    }
                    else {
                        let errorMessage = `Failed to create Ecom Express ${action}`;
                        if (responseItem.error && Array.isArray(responseItem.error) && responseItem.error.length > 0) {
                            errorMessage = responseItem.error[0];
                        }
                        else if (responseItem.reason) {
                            errorMessage = responseItem.reason;
                        }
                        return {
                            success: false,
                            error: errorMessage
                        };
                    }
                }
                return {
                    success: false,
                    error: "Invalid response format from Ecom Express API"
                };
            }
            catch (apiError) {
                if (axios_1.default.isAxiosError(apiError) && apiError.response) {
                    console.error("Ecom Express API Error:", {
                        status: apiError.response.status,
                        statusText: apiError.response.statusText,
                        data: JSON.stringify(apiError.response.data)
                    });
                    if (apiError.response.status === 401) {
                        return {
                            success: false,
                            error: "Authentication failed. Please check credentials or contact support."
                        };
                    }
                    let responseData = apiError.response.data;
                    if (typeof responseData === 'string') {
                        try {
                            responseData = JSON.parse(responseData);
                        }
                        catch (parseError) {
                            console.error("Error parsing error response data:", parseError);
                        }
                    }
                    let errorMessage = "Error communicating with Ecom Express";
                    if (Array.isArray(responseData) && responseData.length > 0) {
                        const responseItem = responseData[0];
                        if (responseItem.error && Array.isArray(responseItem.error) && responseItem.error.length > 0) {
                            errorMessage = responseItem.error[0];
                        }
                        else if (responseItem.reason) {
                            errorMessage = responseItem.reason;
                        }
                    }
                    else if (typeof responseData === 'string') {
                        errorMessage = responseData;
                    }
                    else if (responseData === null || responseData === void 0 ? void 0 : responseData.reason) {
                        errorMessage = responseData.reason;
                    }
                    else if (responseData === null || responseData === void 0 ? void 0 : responseData.message) {
                        errorMessage = responseData.message;
                    }
                    return { success: false, error: errorMessage };
                }
                if (apiError instanceof Error) {
                    return { success: false, error: apiError.message };
                }
                return { success: false, error: "Unknown error occurred while creating Ecom Express NDR" };
            }
        }
        catch (error) {
            console.error("Error in createEcomExpressNdr:", error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                // Handle specific error codes
                if (error.response.status === 401) {
                    return {
                        success: false,
                        error: "Authentication failed. Please check credentials or contact support."
                    };
                }
                // Handle error response that might be a string (JSON string)
                let responseData = error.response.data;
                if (typeof responseData === 'string') {
                    try {
                        responseData = JSON.parse(responseData);
                    }
                    catch (parseError) {
                        console.error("Error parsing error response data:", parseError);
                    }
                }
                // Extract error message from various response formats
                let errorMessage = "Error communicating with Ecom Express";
                if (Array.isArray(responseData) && responseData.length > 0) {
                    const responseItem = responseData[0];
                    if (responseItem.error && Array.isArray(responseItem.error) && responseItem.error.length > 0) {
                        errorMessage = responseItem.error[0];
                    }
                    else if (responseItem.reason) {
                        errorMessage = responseItem.reason;
                    }
                }
                else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
                else if (responseData === null || responseData === void 0 ? void 0 : responseData.reason) {
                    errorMessage = responseData.reason;
                }
                else if (responseData === null || responseData === void 0 ? void 0 : responseData.message) {
                    errorMessage = responseData.message;
                }
                return { success: false, error: errorMessage };
            }
            if (error instanceof Error) {
                return { success: false, error: error.message };
            }
            return {
                success: false,
                error: "An unexpected error occurred while creating Ecom Express NDR request"
            };
        }
    });
}
