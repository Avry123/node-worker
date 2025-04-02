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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShippingOrderApi = createShippingOrderApi;
// import { createAbhilayaOrder } from "./deliveryPartner/abhilaya";
const ats_1 = require("./deliveryPartner/ats");
const delhivery_1 = require("./deliveryPartner/delhivery");
const dtdc_1 = require("./deliveryPartner/dtdc");
const ecom_1 = require("./deliveryPartner/ecom");
const ekart_1 = require("./deliveryPartner/ekart");
const onlinexpress_1 = require("./deliveryPartner/onlinexpress");
const shadowfax_1 = require("./deliveryPartner/shadowfax");
const smartr_1 = require("./deliveryPartner/smartr");
const smartship_1 = require("./deliveryPartner/smartship");
const xpressbees_1 = require("./deliveryPartner/xpressbees");
function createShippingOrderApi(orderId, deliveryPartner) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("hi", orderId, deliveryPartner);
            let response;
            switch (deliveryPartner.toLowerCase()) {
                case "xpressbees":
                    response = yield (0, xpressbees_1.createXpressbeesOrder)(orderId, "1");
                    break;
                case "xpressbees air":
                    response = yield (0, xpressbees_1.createXpressbeesOrder)(orderId, "6");
                    break;
                case "xpressbees 1kg":
                    response = yield (0, xpressbees_1.createXpressbeesOrder)(orderId, "12298");
                    break;
                case "xpressbees 2kg":
                    response = yield (0, xpressbees_1.createXpressbeesOrder)(orderId, "2");
                    break;
                case "xpressbees 5kg":
                    response = yield (0, xpressbees_1.createXpressbeesOrder)(orderId, "3");
                    break;
                case "xpressbees 10kg":
                    response = yield (0, xpressbees_1.createXpressbeesOrder)(orderId, "4");
                    break;
                case "smartr":
                    response = yield (0, smartr_1.createSmartrOrder)(orderId);
                    break;
                case "ekart":
                case "ekart logistics":
                    response = yield (0, ekart_1.createEkartOrder)(orderId);
                    break;
                case "dtdc":
                    response = yield (0, dtdc_1.createDtdcOrder)(orderId, "surface");
                    break;
                case "dtdc surface heavy 1kg":
                    response = yield (0, dtdc_1.createDtdcOrder)(orderId, "surface");
                    break;
                case "dtdc air":
                    response = yield (0, dtdc_1.createDtdcOrder)(orderId, "air");
                    break;
                case "delhivery":
                    response = yield (0, delhivery_1.createDelhiveryOrder)(orderId, "surface", "delhivery");
                    break;
                case "delhivery 5kg":
                    response = yield (0, delhivery_1.createDelhiveryOrder)(orderId, "surface", "delhivery 5kg");
                    break;
                case "delhivery 10kg":
                    response = yield (0, delhivery_1.createDelhiveryOrder)(orderId, "surface", "delhivery 10kg");
                    break;
                case "delhivery 20kg":
                    response = yield (0, delhivery_1.createDelhiveryOrder)(orderId, "surface", "delhivery 20kg");
                    break;
                case "delhivery air":
                    response = yield (0, delhivery_1.createDelhiveryOrder)(orderId, "air", "delhivery air");
                    break;
                case "ats":
                case "ats (amazon transportation services)":
                    response = yield (0, ats_1.createAtsShipment)(orderId);
                    break;
                case "onlinexpress":
                    response = yield (0, onlinexpress_1.createOnlineXpressOrder)(orderId);
                    break;
                case "bluedart surface":
                    response = yield (0, smartship_1.createSmartshipOrder)(orderId, "surface");
                    break;
                case "bluedart":
                    response = yield (0, smartship_1.createSmartshipOrder)(orderId, "air");
                    break;
                case "shadowfax":
                    response = yield (0, shadowfax_1.createShadowfaxOrder)(orderId, "surface");
                    break;
                case "ecom":
                    response = yield (0, ecom_1.createForwardEcomOrder)(orderId);
                    break;
                default:
                    console.error(`Unsupported delivery partner: ${deliveryPartner}`);
            }
            // Check if response exists and contains error message from partner
            if (!response) {
                console.error(`No response from ${deliveryPartner}`);
            }
            if ((response === null || response === void 0 ? void 0 : response.error) || (response === null || response === void 0 ? void 0 : response.errorMessage) || (response === null || response === void 0 ? void 0 : response.message)) {
                return {
                    success: false,
                    awbNumber: null,
                    partnerError: response.error || response.errorMessage || response.message,
                };
            }
            return response;
        }
        catch (error) {
            console.error(`Error creating shipping order for ${deliveryPartner}:`, error);
            return {
                success: false,
                awbNumber: null,
                partnerError: error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    });
}
