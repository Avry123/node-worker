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
exports.createShippingOrderApi = createShippingOrderApi;
// import { createAbhilayaOrder } from "./deliveryPartner/abhilaya";
var ats_1 = require("./deliveryPartner/ats");
var delhivery_1 = require("./deliveryPartner/delhivery");
var dtdc_1 = require("./deliveryPartner/dtdc");
var ecom_1 = require("./deliveryPartner/ecom");
var ekart_1 = require("./deliveryPartner/ekart");
var onlinexpress_1 = require("./deliveryPartner/onlinexpress");
var shadowfax_1 = require("./deliveryPartner/shadowfax");
var smartr_1 = require("./deliveryPartner/smartr");
var smartship_1 = require("./deliveryPartner/smartship");
var xpressbees_1 = require("./deliveryPartner/xpressbees");
function createShippingOrderApi(orderId, deliveryPartner) {
    return __awaiter(this, void 0, void 0, function () {
        var response, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 47, , 48]);
                    console.log("hi", orderId, deliveryPartner);
                    response = void 0;
                    _a = deliveryPartner.toLowerCase();
                    switch (_a) {
                        case "xpressbees": return [3 /*break*/, 1];
                        case "xpressbees air": return [3 /*break*/, 3];
                        case "xpressbees 1kg": return [3 /*break*/, 5];
                        case "xpressbees 2kg": return [3 /*break*/, 7];
                        case "xpressbees 5kg": return [3 /*break*/, 9];
                        case "xpressbees 10kg": return [3 /*break*/, 11];
                        case "smartr": return [3 /*break*/, 13];
                        case "ekart": return [3 /*break*/, 15];
                        case "ekart logistics": return [3 /*break*/, 15];
                        case "dtdc": return [3 /*break*/, 17];
                        case "dtdc surface heavy 1kg": return [3 /*break*/, 19];
                        case "dtdc air": return [3 /*break*/, 21];
                        case "delhivery": return [3 /*break*/, 23];
                        case "delhivery 5kg": return [3 /*break*/, 25];
                        case "delhivery 10kg": return [3 /*break*/, 27];
                        case "delhivery 20kg": return [3 /*break*/, 29];
                        case "delhivery air": return [3 /*break*/, 31];
                        case "ats": return [3 /*break*/, 33];
                        case "ats (amazon transportation services)": return [3 /*break*/, 33];
                        case "onlinexpress": return [3 /*break*/, 35];
                        case "bluedart surface": return [3 /*break*/, 37];
                        case "bluedart": return [3 /*break*/, 39];
                        case "shadowfax": return [3 /*break*/, 41];
                        case "ecom": return [3 /*break*/, 43];
                    }
                    return [3 /*break*/, 45];
                case 1: return [4 /*yield*/, (0, xpressbees_1.createXpressbeesOrder)(orderId, "1")];
                case 2:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 3: return [4 /*yield*/, (0, xpressbees_1.createXpressbeesOrder)(orderId, "6")];
                case 4:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 5: return [4 /*yield*/, (0, xpressbees_1.createXpressbeesOrder)(orderId, "12298")];
                case 6:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 7: return [4 /*yield*/, (0, xpressbees_1.createXpressbeesOrder)(orderId, "2")];
                case 8:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 9: return [4 /*yield*/, (0, xpressbees_1.createXpressbeesOrder)(orderId, "3")];
                case 10:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 11: return [4 /*yield*/, (0, xpressbees_1.createXpressbeesOrder)(orderId, "4")];
                case 12:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 13: return [4 /*yield*/, (0, smartr_1.createSmartrOrder)(orderId)];
                case 14:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 15: return [4 /*yield*/, (0, ekart_1.createEkartOrder)(orderId)];
                case 16:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 17: return [4 /*yield*/, (0, dtdc_1.createDtdcOrder)(orderId, "surface")];
                case 18:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 19: return [4 /*yield*/, (0, dtdc_1.createDtdcOrder)(orderId, "surface")];
                case 20:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 21: return [4 /*yield*/, (0, dtdc_1.createDtdcOrder)(orderId, "air")];
                case 22:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 23: return [4 /*yield*/, (0, delhivery_1.createDelhiveryOrder)(orderId, "surface", "delhivery")];
                case 24:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 25: return [4 /*yield*/, (0, delhivery_1.createDelhiveryOrder)(orderId, "surface", "delhivery 5kg")];
                case 26:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 27: return [4 /*yield*/, (0, delhivery_1.createDelhiveryOrder)(orderId, "surface", "delhivery 10kg")];
                case 28:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 29: return [4 /*yield*/, (0, delhivery_1.createDelhiveryOrder)(orderId, "surface", "delhivery 20kg")];
                case 30:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 31: return [4 /*yield*/, (0, delhivery_1.createDelhiveryOrder)(orderId, "air", "delhivery air")];
                case 32:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 33: return [4 /*yield*/, (0, ats_1.createAtsShipment)(orderId)];
                case 34:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 35: return [4 /*yield*/, (0, onlinexpress_1.createOnlineXpressOrder)(orderId)];
                case 36:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 37: return [4 /*yield*/, (0, smartship_1.createSmartshipOrder)(orderId, "surface")];
                case 38:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 39: return [4 /*yield*/, (0, smartship_1.createSmartshipOrder)(orderId, "air")];
                case 40:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 41: return [4 /*yield*/, (0, shadowfax_1.createShadowfaxOrder)(orderId, "surface")];
                case 42:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 43: return [4 /*yield*/, (0, ecom_1.createForwardEcomOrder)(orderId)];
                case 44:
                    response = _b.sent();
                    return [3 /*break*/, 46];
                case 45:
                    console.error("Unsupported delivery partner: ".concat(deliveryPartner));
                    _b.label = 46;
                case 46:
                    // Check if response exists and contains error message from partner
                    if (!response) {
                        console.error("No response from ".concat(deliveryPartner));
                    }
                    if ((response === null || response === void 0 ? void 0 : response.error) || (response === null || response === void 0 ? void 0 : response.errorMessage) || (response === null || response === void 0 ? void 0 : response.message)) {
                        return [2 /*return*/, {
                                success: false,
                                awbNumber: null,
                                partnerError: response.error || response.errorMessage || response.message,
                            }];
                    }
                    return [2 /*return*/, response];
                case 47:
                    error_1 = _b.sent();
                    console.error("Error creating shipping order for ".concat(deliveryPartner, ":"), error_1);
                    return [2 /*return*/, {
                            success: false,
                            awbNumber: null,
                            partnerError: error_1 instanceof Error ? error_1.message : "Unknown error occurred",
                        }];
                case 48: return [2 /*return*/];
            }
        });
    });
}
