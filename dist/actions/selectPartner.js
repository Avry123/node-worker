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
exports.selectPartnerForApi = selectPartnerForApi;
const pinDetails_1 = require("./pinDetails");
function selectPartnerForApi(orderData, pickupAddress, userPartnerPreferences) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Selecting partner for order: ${orderData.orderData.orderId}`);
            const deliveryData = {
                isReverse: false,
                pickupPin: pickupAddress.pincode.toString(),
                deliveryPin: orderData.customerAddressList.pincode.toString(),
                paymentType: orderData.orderData.paymentMode
                    ? orderData.orderData.paymentMode
                    : "prepaid",
            };
            // const shadowfaxZoneRestrictedOptions = [
            //   "shadowfax sdd",
            //   "shadowfax ndd",
            //   "shadowfax air ndd",
            //   "shadowfax zonal ndd"
            // ];
            let zoneName = null;
            try {
                const pickupPinDetails = yield (0, pinDetails_1.getPinDetails)(pickupAddress.pincode.toString());
                const deliveryPinDetails = yield (0, pinDetails_1.getPinDetails)(orderData.customerAddressList.pincode.toString());
                if (pickupPinDetails && deliveryPinDetails) {
                    const zoneDetails = yield (0, pinDetails_1.CalculateZone)(pickupPinDetails, deliveryPinDetails);
                    zoneName = zoneDetails === null || zoneDetails === void 0 ? void 0 : zoneDetails.zoneName;
                    console.log(`📍 Calculated zone for API order ${orderData.orderData.orderId}: ${zoneName}`);
                }
                else {
                    console.error("❌ Could not calculate zone - missing pin details");
                }
            }
            catch (error) {
                console.error("❌ Error calculating zone:", error);
            }
            let serviceablePartners = [];
            serviceablePartners = (yield (0, pinDetails_1.findServiceablePartners)(deliveryData)) || [];
            console.log('Line 55 ', serviceablePartners);
            if (serviceablePartners.length === 0) {
                console.log("No serviceable partners available.");
                return null;
            }
            // Function to get the first word of a string
            const getMatchingPartnerWords = (str) => {
                if (!str)
                    return "";
                // Special handling for Bluedart
                if (str.toLowerCase().includes("bluedart")) {
                    return str.toLowerCase(); // Return the full string for Bluedart cases
                }
                // For all other partners, just return the first word
                return str.split(" ")[0].toLowerCase();
            };
            // Create a set of first words of serviceable partners
            const lowercasedServiceablePartners = serviceablePartners.map((p) => p.toLowerCase());
            const checkServiceability = (partnerToCheck) => {
                const partnerMatch = getMatchingPartnerWords(partnerToCheck);
                return lowercasedServiceablePartners.some((p) => getMatchingPartnerWords(p) === partnerMatch);
            };
            const air_codes = [
                "bluedart",
                "dtdc air",
                "xpressbees air",
                "delhivery air",
            ];
            const isPartnerValid = (partner) => {
                var _a;
                console.log(`🔍 Validating partner: "${partner}"`, {
                    isDangerous: orderData.orderData.isDangerousGoods,
                    paymentMode: orderData.orderData.paymentMode,
                });
                // Check dangerous goods condition
                if (orderData.orderData.isDangerousGoods &&
                    air_codes.some((code) => partner.toLowerCase() == code)) {
                    console.log(`❌ Partner "${partner}" rejected: Cannot ship dangerous goods via air`);
                    return false;
                }
                // Check COD-Bluedart condition
                if (((_a = orderData.orderData.paymentMode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "prepaid" &&
                    partner.toLowerCase() == "bluedart") {
                    console.log(`❌ Partner "${partner}" rejected: prepaid not available for Bluedart`);
                    return false;
                }
                console.log(`✅ Partner "${partner}" is valid`);
                return true;
            };
            // Check user preferences for a serviceable partner
            let listOfUserSelectedPreference = [];
            for (const preferredPartner of userPartnerPreferences) {
                const preferredPartnerMatch = getMatchingPartnerWords(preferredPartner);
                const partnerServiceable = checkServiceability(preferredPartner);
                console.log("Preferred partner check:", {
                    partner: preferredPartner,
                    isServiceable: partnerServiceable,
                    matchedString: preferredPartnerMatch,
                });
                console.log('Line 130 ', preferredPartner);
                if (partnerServiceable && isPartnerValid(preferredPartner)) {
                    console.log("Line 309 triggered");
                    // return preferredPartner;
                    listOfUserSelectedPreference.push(preferredPartner);
                }
            }
            // If even one delivery partner exists among the preference selected by the user.
            if (listOfUserSelectedPreference.length > 0) {
                return listOfUserSelectedPreference;
            }
            else {
                // Incase no delivery partner selected by the delivery partner is serviceable, default to other partners not selected by him
                let listOfDefaultServiceablePartners = [];
                for (const serviceablePartner of serviceablePartners) {
                    if (isPartnerValid(serviceablePartner)) {
                        console.log("Line 318 triggered");
                        listOfDefaultServiceablePartners.push(serviceablePartner);
                    }
                }
                if (listOfDefaultServiceablePartners.length > 0) {
                    // return listOfDefaultServiceablePartners;
                    return ['delhivery air'];
                }
                else {
                    // If no delivery partner is serviceable return null.
                    return null;
                }
            }
        }
        catch (error) {
            console.error(`Error finding serviceable partners: ${error instanceof Error ? error.message : "Unknown error"}`);
            return null;
        }
    });
}
