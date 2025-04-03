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
exports.selectPartnerForApi = selectPartnerForApi;
var pinDetails_1 = require("./pinDetails");
function selectPartnerForApi(orderData, pickupAddress, userPartnerPreferences) {
    return __awaiter(this, void 0, void 0, function () {
        var deliveryData, zoneName, pickupPinDetails, deliveryPinDetails, zoneDetails, error_1, serviceablePartners, getMatchingPartnerWords_1, lowercasedServiceablePartners_1, checkServiceability, air_codes_1, isPartnerValid, listOfUserSelectedPreference, _i, userPartnerPreferences_1, preferredPartner, preferredPartnerMatch, partnerServiceable, listOfDefaultServiceablePartners, _a, serviceablePartners_1, serviceablePartner, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 10, , 11]);
                    console.log("Selecting partner for order: ".concat(orderData.orderData.orderId));
                    deliveryData = {
                        isReverse: false,
                        pickupPin: pickupAddress.pincode.toString(),
                        deliveryPin: orderData.customerAddressList.pincode.toString(),
                        paymentType: orderData.orderData.paymentMode
                            ? orderData.orderData.paymentMode
                            : "prepaid",
                    };
                    zoneName = null;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, (0, pinDetails_1.getPinDetails)(pickupAddress.pincode.toString())];
                case 2:
                    pickupPinDetails = _b.sent();
                    return [4 /*yield*/, (0, pinDetails_1.getPinDetails)(orderData.customerAddressList.pincode.toString())];
                case 3:
                    deliveryPinDetails = _b.sent();
                    if (!(pickupPinDetails && deliveryPinDetails)) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, pinDetails_1.CalculateZone)(pickupPinDetails, deliveryPinDetails)];
                case 4:
                    zoneDetails = _b.sent();
                    zoneName = zoneDetails === null || zoneDetails === void 0 ? void 0 : zoneDetails.zoneName;
                    console.log("\uD83D\uDCCD Calculated zone for API order ".concat(orderData.orderData.orderId, ": ").concat(zoneName));
                    return [3 /*break*/, 6];
                case 5:
                    console.error("❌ Could not calculate zone - missing pin details");
                    _b.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    console.error("❌ Error calculating zone:", error_1);
                    return [3 /*break*/, 8];
                case 8:
                    serviceablePartners = [];
                    return [4 /*yield*/, (0, pinDetails_1.findServiceablePartners)(deliveryData)];
                case 9:
                    serviceablePartners = (_b.sent()) || [];
                    console.log('Line 55 ', serviceablePartners);
                    if (serviceablePartners.length === 0) {
                        console.log("No serviceable partners available.");
                        return [2 /*return*/, null];
                    }
                    getMatchingPartnerWords_1 = function (str) {
                        if (!str)
                            return "";
                        // Special handling for Bluedart
                        if (str.toLowerCase().includes("bluedart")) {
                            return str.toLowerCase(); // Return the full string for Bluedart cases
                        }
                        // For all other partners, just return the first word
                        return str.split(" ")[0].toLowerCase();
                    };
                    lowercasedServiceablePartners_1 = serviceablePartners.map(function (p) {
                        return p.toLowerCase();
                    });
                    checkServiceability = function (partnerToCheck) {
                        var partnerMatch = getMatchingPartnerWords_1(partnerToCheck);
                        return lowercasedServiceablePartners_1.some(function (p) { return getMatchingPartnerWords_1(p) === partnerMatch; });
                    };
                    air_codes_1 = [
                        "bluedart",
                        "dtdc air",
                        "xpressbees air",
                        "delhivery air",
                    ];
                    isPartnerValid = function (partner) {
                        var _a;
                        console.log("\uD83D\uDD0D Validating partner: \"".concat(partner, "\""), {
                            isDangerous: orderData.orderData.isDangerousGoods,
                            paymentMode: orderData.orderData.paymentMode,
                        });
                        // Check dangerous goods condition
                        if (orderData.orderData.isDangerousGoods &&
                            air_codes_1.some(function (code) { return partner.toLowerCase() == code; })) {
                            console.log("\u274C Partner \"".concat(partner, "\" rejected: Cannot ship dangerous goods via air"));
                            return false;
                        }
                        // Check COD-Bluedart condition
                        if (((_a = orderData.orderData.paymentMode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "prepaid" &&
                            partner.toLowerCase() == "bluedart") {
                            console.log("\u274C Partner \"".concat(partner, "\" rejected: prepaid not available for Bluedart"));
                            return false;
                        }
                        console.log("\u2705 Partner \"".concat(partner, "\" is valid"));
                        return true;
                    };
                    listOfUserSelectedPreference = [];
                    for (_i = 0, userPartnerPreferences_1 = userPartnerPreferences; _i < userPartnerPreferences_1.length; _i++) {
                        preferredPartner = userPartnerPreferences_1[_i];
                        preferredPartnerMatch = getMatchingPartnerWords_1(preferredPartner);
                        partnerServiceable = checkServiceability(preferredPartner);
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
                        return [2 /*return*/, listOfUserSelectedPreference];
                    }
                    else {
                        listOfDefaultServiceablePartners = [];
                        for (_a = 0, serviceablePartners_1 = serviceablePartners; _a < serviceablePartners_1.length; _a++) {
                            serviceablePartner = serviceablePartners_1[_a];
                            if (isPartnerValid(serviceablePartner)) {
                                console.log("Line 318 triggered");
                                listOfDefaultServiceablePartners.push(serviceablePartner);
                            }
                        }
                        if (listOfDefaultServiceablePartners.length > 0) {
                            // return listOfDefaultServiceablePartners;
                            return [2 /*return*/, ['delhivery air']];
                        }
                        else {
                            // If no delivery partner is serviceable return null.
                            return [2 /*return*/, null];
                        }
                    }
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _b.sent();
                    console.error("Error finding serviceable partners: ".concat(error_2 instanceof Error ? error_2.message : "Unknown error"));
                    return [2 /*return*/, null];
                case 11: return [2 /*return*/];
            }
        });
    });
}
