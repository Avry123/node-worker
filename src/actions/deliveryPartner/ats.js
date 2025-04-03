"use server";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.uploadFileToS3AtsLabel = uploadFileToS3AtsLabel;
exports.createAtsShipment = createAtsShipment;
exports.cancelAtsShipment = cancelAtsShipment;
exports.createAmazonNdr = createAmazonNdr;
exports.createAmazonRto = createAmazonRto;
var axios_1 = require("axios");
var tokenManager_1 = require("./tokenManager");
var s3_1 = require("../../lib/s3");
var prisma_1 = require("../../lib/prisma");
var client_1 = require("@prisma/client");
function uploadFileToS3AtsLabel(file, path, sequenceNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var fileExt, originalFileName, paddedSequence, fileName, filePath, arrayBuffer, bucketName, params, Location;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!file) {
                        console.error("AWS_BUCKET_NAME is not defined");
                        return [2 /*return*/, { success: false, message: "AWS_BUCKET_NAME is not defined" }];
                        // throw new Error("No file provided");
                    }
                    fileExt = file.name
                        ? file.name.split(".").pop() || "unknown"
                        : "unknown";
                    originalFileName = file.name ? file.name.split(".")[0] : "unnamed";
                    paddedSequence = String(sequenceNumber).padStart(2, "0");
                    fileName = "".concat(paddedSequence, "-").concat(originalFileName, "-").concat(Date.now(), ".").concat(fileExt);
                    filePath = "".concat(path, "/").concat(fileName);
                    return [4 /*yield*/, file.arrayBuffer()];
                case 1:
                    arrayBuffer = _a.sent();
                    bucketName = process.env.AWS_BUCKET_NAME;
                    if (!bucketName) {
                        return [2 /*return*/, { success: false, message: "AWS_BUCKET_NAME is not defined" }];
                    }
                    params = {
                        Bucket: bucketName,
                        Key: filePath,
                        Body: Buffer.from(arrayBuffer),
                        ContentType: file.type || "application/octet-stream",
                    };
                    return [4 /*yield*/, s3_1.default.upload(params).promise()];
                case 2:
                    Location = (_a.sent()).Location;
                    return [2 /*return*/, {
                            success: true,
                            message: Location,
                        }];
            }
        });
    });
}
function formatAddressLines(address, landmark) {
    var result = {
        addressLine1: "",
        addressLine2: "",
        addressLine3: "",
    };
    if (!address)
        return result;
    if (address.length <= 60) {
        result.addressLine1 = address;
        if (landmark && landmark.length <= 60) {
            result.addressLine2 = landmark;
        }
        else if (landmark) {
            result.addressLine3 = landmark;
        }
    }
    else {
        var breakPoint = address.substring(0, 60).lastIndexOf(" ");
        var splitIndex = breakPoint > 0 ? breakPoint : 60;
        result.addressLine1 = address.substring(0, splitIndex).trim();
        var remainingAddress = address.substring(splitIndex).trim();
        if (landmark && remainingAddress.length + landmark.length + 2 <= 60) {
            result.addressLine2 = "".concat(remainingAddress, ", ").concat(landmark);
        }
        else {
            result.addressLine2 = remainingAddress;
            if (landmark) {
                result.addressLine3 = landmark;
            }
        }
    }
    return result;
}
function createAtsShipment(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var token, order_1, warehouseAddress, rtoWarehouseAddress, customerAddress, totalPackagesQuantity, weightPerUnit_1, requestBody, config, response, updatedOrder, shipmentId, awbNumber, payLoad, pdfBuffer, file, fileUploadLink, safeToNumber, axiosError_1, errorObject, errorMessage, errorDetails, error_1;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    _k.trys.push([0, 13, , 14]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ats")];
                case 1:
                    token = _k.sent();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
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
                        })];
                case 2:
                    order_1 = _k.sent();
                    if (!order_1) {
                        console.error("Eror: ", {
                            data: "Order not found",
                            path: "deliveryPartner/ats",
                        });
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    if (order_1.Packages.length === 0) {
                        console.error("Error:", {
                            data: "No packages found for this order",
                            path: "deliveryPartner/ats",
                        });
                        return [2 /*return*/, { success: false, error: "No packages found for this order" }];
                    }
                    return [4 /*yield*/, prisma_1.default.address.findFirst({
                            where: {
                                id: order_1.agentAddressId || undefined,
                            },
                        })];
                case 3:
                    warehouseAddress = _k.sent();
                    return [4 /*yield*/, prisma_1.default.address.findUnique({
                            where: { id: (_a = order_1.rtoAgentAddressId) !== null && _a !== void 0 ? _a : undefined },
                        })];
                case 4:
                    rtoWarehouseAddress = _k.sent();
                    if (!warehouseAddress || !rtoWarehouseAddress) {
                        console.error("Eror: ", {
                            data: "Warehouse address or RTO warehouse address not found",
                            path: "deliveryPartner/ats",
                        });
                        return [2 /*return*/, {
                                success: false,
                                error: "Warehouse address or RTO warehouse address not found",
                            }];
                    }
                    customerAddress = order_1.customerAddress;
                    if (!customerAddress) {
                        console.error("Error: ", {
                            data: "Customer address not found",
                            path: "deliveryPartner/ats",
                        });
                        return [2 /*return*/, { success: false, error: "Customer address not found" }];
                    }
                    totalPackagesQuantity = order_1.Packages.reduce(function (sum, p) { return sum + p.quantity; }, 0);
                    weightPerUnit_1 = Number(order_1.applicableWeight) / totalPackagesQuantity;
                    requestBody = {
                        shipTo: __assign({ name: customerAddress.fullName, email: customerAddress.email, phoneNumber: customerAddress.contactNumber, city: customerAddress.city, stateOrRegion: customerAddress.state, countryCode: "IN", postalCode: ((_b = customerAddress.pincode) === null || _b === void 0 ? void 0 : _b.toString()) || "" }, formatAddressLines(customerAddress.address, customerAddress.landmark)),
                        shipFrom: __assign({ name: order_1.Users.StoreName || warehouseAddress.tag, phoneNumber: warehouseAddress.contactNumber, city: warehouseAddress.city, stateOrRegion: warehouseAddress.state, countryCode: "IN", postalCode: ((_c = warehouseAddress.pincode) === null || _c === void 0 ? void 0 : _c.toString()) || "" }, formatAddressLines(warehouseAddress.address, warehouseAddress.landmark)),
                        returnTo: __assign({ name: order_1.Users.StoreName || rtoWarehouseAddress.tag, phoneNumber: rtoWarehouseAddress.contactNumber, city: rtoWarehouseAddress.city, stateOrRegion: rtoWarehouseAddress.state, countryCode: "IN", postalCode: ((_d = rtoWarehouseAddress.pincode) === null || _d === void 0 ? void 0 : _d.toString()) || "" }, formatAddressLines(rtoWarehouseAddress.address, rtoWarehouseAddress.landmark)),
                        packages: [
                            {
                                dimensions: {
                                    length: Number(order_1.length) || 0,
                                    width: Number(order_1.breadth) || 0,
                                    height: Number(order_1.height) || 0,
                                    unit: "CENTIMETER",
                                },
                                weight: {
                                    unit: "KILOGRAM",
                                    value: Number(order_1.applicableWeight),
                                },
                                items: order_1.Packages.map(function (pkg, index) { return ({
                                    quantity: pkg.quantity,
                                    weight: {
                                        unit: "KILOGRAM",
                                        value: weightPerUnit_1,
                                    },
                                    description: pkg.productName,
                                    itemIdentifier: "item-".concat(order_1.id, "-").concat(index),
                                    isHazmat: false,
                                    productType: pkg.category || "N/A",
                                    itemValue: {
                                        value: Number(pkg.price),
                                        unit: "INR",
                                    },
                                    invoiceDetails: {
                                        invoiceNumber: "",
                                    },
                                }); }),
                                isHazmat: false,
                                sellerDisplayName: order_1.Users.StoreName || warehouseAddress.tag || "NA",
                                insuredValue: {
                                    unit: "INR",
                                    value: Number(order_1.totalOrderValue),
                                },
                                packageClientReferenceId: "".concat(order_1.id),
                            },
                        ],
                        taxDetails: [
                            {
                                taxType: "GST",
                                taxRegistrationNumber: "anbp1234",
                            },
                        ],
                        channelDetails: {
                            channelType: "EXTERNAL",
                        },
                        serviceSelection: {
                            serviceId: ["SWA-IN-OA"],
                        },
                        labelSpecifications: {
                            format: "PDF",
                            size: {
                                width: 4,
                                length: 6,
                                unit: "INCH",
                            },
                            dpi: 203,
                            pageLayout: "DEFAULT",
                            needFileJoining: false,
                            requestedDocumentTypes: ["LABEL"],
                        },
                    };
                    // Add COD details if needed
                    if (((_e = order_1.paymentMode) === null || _e === void 0 ? void 0 : _e.toLowerCase()) !== "prepaid") {
                        requestBody["valueAddedServiceDetails"] = [
                            {
                                id: "CollectOnDelivery",
                                amount: {
                                    unit: "INR",
                                    value: Number(order_1.totalOrderValue),
                                },
                            },
                        ];
                    }
                    config = {
                        method: "post",
                        maxBodyLength: Infinity,
                        url: "https://sellingpartnerapi-eu.amazon.com/shipping/v2/oneClickShipment",
                        headers: {
                            "x-amzn-shipping-business-id": "AmazonShipping_IN",
                            "x-amz-access-token": token,
                            "Content-Type": "application/json",
                        },
                        data: requestBody,
                    };
                    //   console.log(requestBody.packages[0].items[0], requestBody.packages[0].items[1]) ;
                    console.log(JSON.stringify(requestBody), "requestBody for ats");
                    _k.label = 5;
                case 5:
                    _k.trys.push([5, 11, , 12]);
                    return [4 /*yield*/, axios_1.default.request(config)];
                case 6:
                    response = _k.sent();
                    updatedOrder = void 0;
                    if (!(response.data && response.data.payload.shipmentId)) return [3 /*break*/, 9];
                    shipmentId = response.data.payload.shipmentId;
                    awbNumber = response.data.payload.packageDocumentDetails[0].trackingId;
                    payLoad = response.data.payload.packageDocumentDetails[0].packageDocuments[0]
                        .contents;
                    pdfBuffer = Buffer.from(payLoad, "base64");
                    file = new File([pdfBuffer], "".concat(awbNumber, ".pdf"), {
                        type: "application/pdf",
                    });
                    return [4 /*yield*/, uploadFileToS3AtsLabel(file, awbNumber, 1)];
                case 7:
                    fileUploadLink = _k.sent();
                    if (!fileUploadLink.success) {
                        return [2 /*return*/, {
                                success: false,
                                message: "Error Occured in storing label",
                            }];
                    }
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: { id: orderId },
                            data: {
                                status: client_1.OrderStatus.READY_TO_SHIP,
                                awbNumber: awbNumber,
                                responseOrderId: shipmentId,
                                shippingDate: new Date(),
                                AtsLabel: fileUploadLink.message,
                            },
                        })];
                case 8:
                    updatedOrder = _k.sent();
                    return [3 /*break*/, 10];
                case 9:
                    console.error("Invalid response structure from shipping service");
                    return [2 /*return*/, {
                            success: false,
                            message: "Invalid response structure from shipping service ats",
                        }];
                case 10:
                    safeToNumber = function (value) {
                        return value ? value.toNumber() : null;
                    };
                    return [2 /*return*/, {
                            success: true,
                            order: __assign(__assign({}, updatedOrder), { deadWeight: safeToNumber(updatedOrder.deadWeight), breadth: safeToNumber(updatedOrder.breadth), height: safeToNumber(updatedOrder.height), length: safeToNumber(updatedOrder.length), applicableWeight: safeToNumber(updatedOrder.applicableWeight), totalOrderValue: safeToNumber(updatedOrder.totalOrderValue) }),
                            awbNumber: updatedOrder.awbNumber ? updatedOrder.awbNumber.toString() : '',
                        }];
                case 11:
                    axiosError_1 = _k.sent();
                    // Handle Axios errors with detailed messages
                    if (axiosError_1.response) {
                        errorObject = (_g = (_f = axiosError_1.response.data) === null || _f === void 0 ? void 0 : _f.errors) === null || _g === void 0 ? void 0 : _g[0];
                        errorMessage = (errorObject === null || errorObject === void 0 ? void 0 : errorObject.message) ||
                            ((_h = axiosError_1.response.data) === null || _h === void 0 ? void 0 : _h.message) ||
                            ((_j = axiosError_1.response.data) === null || _j === void 0 ? void 0 : _j.error) ||
                            "Delivery partner service error";
                        errorDetails = (errorObject === null || errorObject === void 0 ? void 0 : errorObject.details)
                            ? " Details: ".concat(errorObject.details)
                            : "";
                        console.log("Full error object:", errorObject);
                        console.error("Delivery Partner Error:", {
                            status: axiosError_1.response.status,
                            data: errorMessage + errorDetails, // Combine message and details
                            path: "deliveryPartner/ats",
                        });
                        return [2 /*return*/, {
                                success: false,
                                error: errorMessage + errorDetails, // Return both message and details
                                details: axiosError_1.response.data, // Include full error details for debugging
                            }];
                    }
                    else if (axiosError_1.request) {
                        // The request was made but no response was received
                        console.error("Network Error:", {
                            error: "No response received from delivery partner",
                            path: "deliveryPartner/ats",
                        });
                        return [2 /*return*/, {
                                success: false,
                                error: "Unable to connect to delivery partner service. Please try again later.",
                            }];
                    }
                    else {
                        // Something happened in setting up the request that triggered an Error
                        console.error("Request Setup Error:", {
                            error: axiosError_1.message,
                            path: "deliveryPartner/ats",
                        });
                        return [2 /*return*/, {
                                success: false,
                                error: "Failed to process shipping request. Please check the order details and try again.",
                            }];
                    }
                    return [3 /*break*/, 12];
                case 12: return [3 /*break*/, 14];
                case 13:
                    error_1 = _k.sent();
                    console.error(JSON.stringify({
                        data: "Error in createAtsShipment:",
                        error: error_1,
                        path: "deliveryPartner/ats",
                    }));
                    return [2 /*return*/, {
                            success: false,
                            error: error_1 instanceof Error
                                ? error_1.message
                                : "An unexpected error occurred while processing your shipping request",
                        }];
                case 14: return [2 /*return*/];
            }
        });
    });
}
function cancelAtsShipment(shipmentId) {
    return __awaiter(this, void 0, void 0, function () {
        var token, config, response, order, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ats")];
                case 1:
                    token = _a.sent();
                    config = {
                        method: "put",
                        maxBodyLength: Infinity,
                        url: "https://sellingpartnerapi-eu.amazon.com/shipping/v2/shipments/".concat(shipmentId, "/cancel"),
                        headers: {
                            "x-amzn-shipping-business-id": "AmazonShipping_IN",
                            "x-amz-access-token": token,
                            "Content-Type": "application/json",
                        },
                    };
                    console.log(config, "response from cancelAtsShipment");
                    return [4 /*yield*/, axios_1.default.request(config)];
                case 2:
                    response = _a.sent();
                    console.log(response, "response from cancelAtsShipment");
                    if (!(response.status === 200 && response.data.payload)) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma_1.default.orders.findFirst({
                            where: {
                                responseOrderId: shipmentId,
                            },
                        })];
                case 3:
                    order = _a.sent();
                    if (!order) {
                        console.error("Error: ", {
                            data: "Order not found for the given shipment ID",
                            path: "deliveryPartner/ats",
                        });
                    }
                    return [2 /*return*/, {
                            success: true,
                            error: "Order not found for the given shipment ID",
                            message: "Successfully cancelled ATS shipment",
                        }];
                case 4:
                    console.error("Eror: ", {
                        data: "Failed to cancel shipment with ATS",
                        path: "deliveryPartner/ats",
                    });
                    return [2 /*return*/, {
                            success: false,
                            error: "Failed to cancel shipment with ATS",
                            message: "Failed to cancel shipment with ATS",
                        }];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.error(JSON.stringify({
                        data: "Error in cancelAtsShipment:",
                        error: error_2,
                        path: "deliveryPartner/ats",
                    }));
                    return [2 /*return*/, {
                            success: false,
                            error: error_2 instanceof Error ? error_2.message : "An unknown error occurred",
                            message: error_2 instanceof Error ? error_2.message : "An unknown error occurred",
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function createAmazonNdr(order, data, action) {
    return __awaiter(this, void 0, void 0, function () {
        var token, orders, ndrAction, ndrRequestData, requestBody, response, customerId, dbError_1, apiError_1, errorData, errorMessage, error_3, errorData, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting createAmazonNdr for orderId:", order.orderId);
                    console.log("Data:", data);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 15, , 16]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ats")];
                case 2:
                    token = _a.sent();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
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
                        })];
                case 3:
                    orders = _a.sent();
                    if (!orders) {
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    ndrAction = "REATTEMPT";
                    ndrRequestData = {};
                    if (data.address) {
                        ndrRequestData.additionalAddressNotes = data.address || "";
                    }
                    else {
                        ndrRequestData.additionalAddressNotes = orders.customerAddress;
                    }
                    if (action == "rto") {
                        console.log("RTO action");
                        ndrAction = "RTO";
                        ndrRequestData = {};
                    }
                    requestBody = {
                        trackingId: orders.awbNumber,
                        ndrAction: ndrAction,
                        ndrRequestData: ndrRequestData
                    };
                    console.log("Amazon NDR request body:", JSON.stringify(requestBody));
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 13, , 14]);
                    return [4 /*yield*/, axios_1.default.post("https://sellingpartnerapi-eu.amazon.com/shipping/v2/ndrFeedback", requestBody, {
                            headers: {
                                "x-amzn-shipping-business-id": "AmazonShipping_IN",
                                "x-amz-access-token": token,
                                "Content-Type": "application/json",
                            },
                        })];
                case 5:
                    response = _a.sent();
                    console.log("Amazon NDR Response:", JSON.stringify(response.data));
                    if (!(response.data && response.status === 200)) return [3 /*break*/, 11];
                    if (!data.address) return [3 /*break*/, 10];
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 9, , 10]);
                    customerId = orders.forwardCustomerId || orders.reverseCustomerId;
                    if (!customerId) return [3 /*break*/, 8];
                    return [4 /*yield*/, prisma_1.default.customerAddress.update({
                            where: {
                                customerId: customerId
                            },
                            data: {
                                address: data.address || undefined,
                            }
                        })];
                case 7:
                    _a.sent();
                    console.log("Customer address updated successfully");
                    _a.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    dbError_1 = _a.sent();
                    console.error("Error updating customer address:", dbError_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, {
                        success: true,
                        message: "Amazon NDR ".concat(ndrAction.toLowerCase(), " submitted successfully"),
                        data: response.data
                    }];
                case 11: return [2 /*return*/, {
                        success: false,
                        error: "Failed to submit Amazon NDR feedback"
                    }];
                case 12: return [3 /*break*/, 14];
                case 13:
                    apiError_1 = _a.sent();
                    if (axios_1.default.isAxiosError(apiError_1) && apiError_1.response) {
                        console.error("Amazon API Error:", {
                            status: apiError_1.response.status,
                            statusText: apiError_1.response.statusText,
                            data: JSON.stringify(apiError_1.response.data)
                        });
                        errorData = void 0;
                        if (typeof apiError_1.response.data === 'string') {
                            try {
                                errorData = JSON.parse(apiError_1.response.data);
                            }
                            catch (e) {
                                errorData = { message: apiError_1.response.data };
                            }
                        }
                        else {
                            errorData = apiError_1.response.data;
                        }
                        errorMessage = "Error from Amazon API";
                        if ((errorData === null || errorData === void 0 ? void 0 : errorData.errors) && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                            // If there are specific details, use them
                            if (errorData.errors[0].details) {
                                errorMessage = errorData.errors[0].details;
                            }
                            else if (errorData.errors[0].message) {
                                errorMessage = errorData.errors[0].message;
                            }
                        }
                        else if (errorData === null || errorData === void 0 ? void 0 : errorData.message) {
                            errorMessage = errorData.message;
                        }
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    }
                    if (apiError_1 instanceof Error) {
                        return [2 /*return*/, { success: false, error: apiError_1.message }];
                    }
                    return [2 /*return*/, { success: false, error: "Unknown error occurred while submitting Amazon NDR feedback" }];
                case 14: return [3 /*break*/, 16];
                case 15:
                    error_3 = _a.sent();
                    console.error("Error in createAmazonNdr:", error_3);
                    if (axios_1.default.isAxiosError(error_3) && error_3.response) {
                        errorData = void 0;
                        if (typeof error_3.response.data === 'string') {
                            try {
                                errorData = JSON.parse(error_3.response.data);
                            }
                            catch (e) {
                                errorData = { message: error_3.response.data };
                            }
                        }
                        else {
                            errorData = error_3.response.data;
                        }
                        errorMessage = "Unknown API error";
                        if ((errorData === null || errorData === void 0 ? void 0 : errorData.errors) && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                            // If there are specific details, use them
                            if (errorData.errors[0].details) {
                                errorMessage = errorData.errors[0].details;
                            }
                            else if (errorData.errors[0].message) {
                                errorMessage = errorData.errors[0].message;
                            }
                        }
                        else if (errorData === null || errorData === void 0 ? void 0 : errorData.message) {
                            errorMessage = errorData.message;
                        }
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    }
                    if (error_3 instanceof Error) {
                        return [2 /*return*/, { success: false, error: error_3.message }];
                    }
                    return [2 /*return*/, {
                            success: false,
                            error: "An unexpected error occurred while submitting Amazon NDR feedback"
                        }];
                case 16: return [2 /*return*/];
            }
        });
    });
}
function createAmazonRto(order) {
    return __awaiter(this, void 0, void 0, function () {
        var token, orders, requestBody, response, apiError_2, errorData, errorMessage, error_4, errorData, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting createAmazonRto for orderId:", order.orderId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, (0, tokenManager_1.getDeliveryPartnerToken)("ats")];
                case 2:
                    token = _a.sent();
                    return [4 /*yield*/, prisma_1.default.orders.findUnique({
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
                        })];
                case 3:
                    orders = _a.sent();
                    if (!orders) {
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    requestBody = {
                        trackingId: orders.awbNumber,
                        ndrAction: "RTO",
                        ndrRequestData: {}
                    };
                    console.log("Amazon RTO request body:", JSON.stringify(requestBody));
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, axios_1.default.post("https://sellingpartnerapi-eu.amazon.com/shipping/v2/ndrFeedback", requestBody, {
                            headers: {
                                "x-amzn-shipping-business-id": "AmazonShipping_IN",
                                "x-amz-access-token": token,
                                "Content-Type": "application/json",
                            },
                        })];
                case 5:
                    response = _a.sent();
                    console.log("Amazon RTO Response:", JSON.stringify(response.data));
                    if (response.data && response.status === 200) {
                        return [2 /*return*/, {
                                success: true,
                                message: "Amazon RTO submitted successfully",
                                data: response.data
                            }];
                    }
                    else {
                        return [2 /*return*/, {
                                success: false,
                                error: "Failed to submit Amazon RTO feedback"
                            }];
                    }
                    return [3 /*break*/, 7];
                case 6:
                    apiError_2 = _a.sent();
                    if (axios_1.default.isAxiosError(apiError_2) && apiError_2.response) {
                        console.error("Amazon API Error:", {
                            status: apiError_2.response.status,
                            statusText: apiError_2.response.statusText,
                            data: JSON.stringify(apiError_2.response.data)
                        });
                        errorData = void 0;
                        if (typeof apiError_2.response.data === 'string') {
                            try {
                                errorData = JSON.parse(apiError_2.response.data);
                            }
                            catch (e) {
                                errorData = { message: apiError_2.response.data };
                            }
                        }
                        else {
                            errorData = apiError_2.response.data;
                        }
                        errorMessage = "Error from Amazon API";
                        if ((errorData === null || errorData === void 0 ? void 0 : errorData.errors) && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                            // If there are specific details, use them
                            if (errorData.errors[0].details) {
                                errorMessage = errorData.errors[0].details;
                            }
                            else if (errorData.errors[0].message) {
                                errorMessage = errorData.errors[0].message;
                            }
                        }
                        else if (errorData === null || errorData === void 0 ? void 0 : errorData.message) {
                            errorMessage = errorData.message;
                        }
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    }
                    if (apiError_2 instanceof Error) {
                        return [2 /*return*/, { success: false, error: apiError_2.message }];
                    }
                    return [2 /*return*/, { success: false, error: "Unknown error occurred while submitting Amazon RTO feedback" }];
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_4 = _a.sent();
                    console.error("Error in createAmazonNdr:", error_4);
                    if (axios_1.default.isAxiosError(error_4) && error_4.response) {
                        errorData = void 0;
                        if (typeof error_4.response.data === 'string') {
                            try {
                                errorData = JSON.parse(error_4.response.data);
                            }
                            catch (e) {
                                errorData = { message: error_4.response.data };
                            }
                        }
                        else {
                            errorData = error_4.response.data;
                        }
                        errorMessage = "Unknown API error";
                        if ((errorData === null || errorData === void 0 ? void 0 : errorData.errors) && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                            // If there are specific details, use them
                            if (errorData.errors[0].details) {
                                errorMessage = errorData.errors[0].details;
                            }
                            else if (errorData.errors[0].message) {
                                errorMessage = errorData.errors[0].message;
                            }
                        }
                        else if (errorData === null || errorData === void 0 ? void 0 : errorData.message) {
                            errorMessage = errorData.message;
                        }
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    }
                    if (error_4 instanceof Error) {
                        return [2 /*return*/, { success: false, error: error_4.message }];
                    }
                    return [2 /*return*/, {
                            success: false,
                            error: "An unexpected error occurred while submitting Amazon NDR feedback"
                        }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
