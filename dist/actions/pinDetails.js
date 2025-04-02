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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinValidator = pinValidator;
exports.getPinDetails = getPinDetails;
exports.CalculateZone = CalculateZone;
exports.findServiceablePartners = findServiceablePartners;
const prisma_1 = __importDefault(require("../lib/prisma"));
function pinValidator(pincode) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // Handle empty pincode case
        if (pincode === "") {
            return {
                district: "",
                state: "",
                pincode: "",
                country: "",
                landmark: "",
                city: "",
            };
        }
        // Validate pincode format
        if (!/^\d{6}$/.test(pincode)) {
            console.error("Invalid pincode format:", pincode);
            return { error: "Invalid pincode format" };
        }
        try {
            // First attempt with Shypbuddy API
            const postalResponse = yield fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const postalData = yield postalResponse.json();
            // Check if Postal API returns valid data
            if ((_b = (_a = postalData === null || postalData === void 0 ? void 0 : postalData[0]) === null || _a === void 0 ? void 0 : _a.PostOffice) === null || _b === void 0 ? void 0 : _b[0]) {
                const postOffice = postalData[0].PostOffice[0];
                return {
                    district: postOffice.District || "",
                    state: postOffice.State || "",
                    pincode: pincode,
                    country: postOffice.Country || "",
                    landmark: postOffice.Name || "", // Landmark based on Name
                    city: postOffice.Region || "",
                };
            }
            // Fallback to Postal API if Shypbuddy doesn't return valid data
            const shypbuddyResponse = yield fetch(`https://admin.shypbuddy.net/api/pincode/${pincode}`);
            const shypbuddyData = yield shypbuddyResponse.json();
            // Check if the Shypbuddy API returns valid data
            if ((shypbuddyData === null || shypbuddyData === void 0 ? void 0 : shypbuddyData.success) && (shypbuddyData === null || shypbuddyData === void 0 ? void 0 : shypbuddyData.data)) {
                return {
                    district: shypbuddyData.data.district || "",
                    state: shypbuddyData.data.state || "",
                    pincode: pincode,
                    country: "India", // Default country is India for ShypBuddy
                    landmark: "", // ShypBuddy doesn't provide landmark
                    city: shypbuddyData.data.city || "",
                };
            }
            // If no valid data is found in both APIs
            console.warn(`No data found for pincode ${pincode} in both APIs`);
            return { error: "Pincode not found" };
        }
        catch (err) {
            // Improved error handling, return a structured error response
            console.error("Error fetching pincode details:", err);
            return { error: "Failed to fetch pincode details", details: err };
        }
    });
}
function getPinDetails(pincode) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield pinValidator(pincode);
            if (response) {
                // const res = response.data[0].PostOffice[0];
                const deliveryData = {
                    zone: response.state ? response.state.trim() : "",
                    pin: pincode,
                    district: response.district ? response.district.trim() : "",
                    state: response.state ? response.state.trim() : "",
                    Region: response.city ? response.city.trim() : "",
                };
                return deliveryData;
            }
            else {
                console.error("Invalid response structure for pincode:", pincode);
                return null;
            }
        }
        catch (error) {
            console.error("Error fetching pin details:", error);
            return null;
        }
    });
}
function CalculateZone(pickup, drop) {
    return __awaiter(this, void 0, void 0, function* () {
        "use server";
        const SpecialZones = [
            "Kerala",
            "Assam",
            "Sikkim",
            "Mizoram",
            "Jammu & Kashmir",
            "Meghalaya",
            "Manipur",
            "Tripura",
            "Nagaland",
            "Arunachal Pradesh",
            "Andaman & Nicobar",
        ];
        const MetroCities = [
            "Chennai",
            "Bangalore",
            "Mumbai",
            "Delhi",
            "Kolkata",
            "Lucknow  HQ",
            "Calcutta",
            "Bangalore HQ",
            "New Delhi",
        ];
        try {
            console.log(pickup, drop, " this is the pickup and drop details");
            if (!pickup || !drop || !pickup.state || !drop.state) {
                console.error("Pickup or drop information is missing:", { pickup, drop });
                return { status: 500, zoneName: "No_Zone" };
            }
            const isSpecialZone = SpecialZones.some((zone) => pickup.state.includes(zone) || drop.state.includes(zone));
            const isSameState = pickup.state === drop.state;
            const isSameRegion = pickup.Region === drop.Region;
            if (pickup.state == drop.state) {
                console.log("Same State: ", pickup.state, drop.state);
            }
            // console.log(pickup.Region, " Region: ", drop.Region);
            let zoneName;
            if (isSpecialZone) {
                zoneName = "SpecialZone";
            }
            else if (isSameState) {
                console.log("Same State: ", pickup.state, drop.state);
                zoneName = isSameRegion ? "WithinCity" : "WithinZone";
            }
            else {
                zoneName =
                    MetroCities.includes(pickup.Region) && MetroCities.includes(drop.Region)
                        ? "MetrotoMetro"
                        : "RestofIndia";
                // console.log(zoneName, " line 68 ", MetroCities.includes(pickup.Region));
            }
            if (MetroCities.includes(pickup.Region)) {
                // console.log("Pickup Region True: ", pickup.Region);
            }
            else {
                // console.log("False");
            }
            if (MetroCities.includes(drop.Region)) {
                // console.log("drop Region True: ", drop.Region);
            }
            return { status: 200, zoneName: zoneName };
        }
        catch (error) {
            console.log("An error occured in rateCalulator,ts line 71: ", error);
            return { status: 500, zoneName: "No_Zone" };
        }
    });
}
function findServiceablePartners(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pickupServiceablePartners;
            let deliveryServiceablePartners;
            if (data.isReverse) {
                // For reverse logistics, swap the pincode table lookups
                const pickupPincodeData = yield prisma_1.default.deliveryPincode.findUnique({
                    where: { Pincode: data.pickupPin },
                });
                if (!pickupPincodeData) {
                    console.error(`Pickup pincode ${data.pickupPin} not found in delivery pincode table`);
                    return [];
                }
                pickupServiceablePartners = pickupPincodeData.Rev;
                const deliveryPincodeData = yield prisma_1.default.pickupPincode.findUnique({
                    where: { Pincode: data.deliveryPin },
                });
                if (!deliveryPincodeData) {
                    console.error(`Delivery pincode ${data.deliveryPin} not found in pickup pincode table`);
                    return [];
                }
                deliveryServiceablePartners = deliveryPincodeData.Serviceable;
            }
            else {
                // For normal logistics, use the original logic
                const pickupPincodeData = yield prisma_1.default.pickupPincode.findUnique({
                    where: { Pincode: data.pickupPin },
                });
                if (!pickupPincodeData) {
                    console.error(`Pickup pincode ${data.pickupPin} not found in pickup pincode table`);
                    return [];
                }
                pickupServiceablePartners = pickupPincodeData.Serviceable;
                const deliveryPincodeData = yield prisma_1.default.deliveryPincode.findUnique({
                    where: { Pincode: data.deliveryPin },
                });
                if (!deliveryPincodeData) {
                    console.error(`Delivery pincode ${data.deliveryPin} not found in delivery pincode table`);
                    return [];
                }
                if (data.paymentType === "cod") {
                    deliveryServiceablePartners = deliveryPincodeData.Cod;
                }
                else {
                    deliveryServiceablePartners = deliveryPincodeData.Serviceable;
                }
            }
            // console.log("Pickup Serviceable Partners:", pickupServiceablePartners);
            // console.log("Delivery Serviceable Partners:", deliveryServiceablePartners);
            // Find common serviceable partners
            const commonServiceablePartners = pickupServiceablePartners.filter((partner) => deliveryServiceablePartners.includes(partner));
            console.log("type aman: new", data);
            if (data.paymentType.toLowerCase() === "prepaid") {
                const index = commonServiceablePartners.indexOf("bluedart");
                if (index > -1) {
                    commonServiceablePartners.splice(index, 1);
                }
            }
            return commonServiceablePartners;
        }
        catch (error) {
            console.error("Error in findServiceablePartners:", error);
            return [];
        }
    });
}
