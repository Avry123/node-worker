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
exports.pinValidator = pinValidator;
exports.getPinDetails = getPinDetails;
exports.CalculateZone = CalculateZone;
exports.findServiceablePartners = findServiceablePartners;
var prisma_1 = require("../lib/prisma");
function pinValidator(pincode) {
    return __awaiter(this, void 0, void 0, function () {
        var postalResponse, postalData, postOffice, shypbuddyResponse, shypbuddyData, err_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // Handle empty pincode case
                    if (pincode === "") {
                        return [2 /*return*/, {
                                district: "",
                                state: "",
                                pincode: "",
                                country: "",
                                landmark: "",
                                city: "",
                            }];
                    }
                    // Validate pincode format
                    if (!/^\d{6}$/.test(pincode)) {
                        console.error("Invalid pincode format:", pincode);
                        return [2 /*return*/, { error: "Invalid pincode format" }];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("https://api.postalpincode.in/pincode/".concat(pincode))];
                case 2:
                    postalResponse = _c.sent();
                    return [4 /*yield*/, postalResponse.json()];
                case 3:
                    postalData = _c.sent();
                    // Check if Postal API returns valid data
                    if ((_b = (_a = postalData === null || postalData === void 0 ? void 0 : postalData[0]) === null || _a === void 0 ? void 0 : _a.PostOffice) === null || _b === void 0 ? void 0 : _b[0]) {
                        postOffice = postalData[0].PostOffice[0];
                        return [2 /*return*/, {
                                district: postOffice.District || "",
                                state: postOffice.State || "",
                                pincode: pincode,
                                country: postOffice.Country || "",
                                landmark: postOffice.Name || "", // Landmark based on Name
                                city: postOffice.Region || "",
                            }];
                    }
                    return [4 /*yield*/, fetch("https://admin.shypbuddy.net/api/pincode/".concat(pincode))];
                case 4:
                    shypbuddyResponse = _c.sent();
                    return [4 /*yield*/, shypbuddyResponse.json()];
                case 5:
                    shypbuddyData = _c.sent();
                    // Check if the Shypbuddy API returns valid data
                    if ((shypbuddyData === null || shypbuddyData === void 0 ? void 0 : shypbuddyData.success) && (shypbuddyData === null || shypbuddyData === void 0 ? void 0 : shypbuddyData.data)) {
                        return [2 /*return*/, {
                                district: shypbuddyData.data.district || "",
                                state: shypbuddyData.data.state || "",
                                pincode: pincode,
                                country: "India", // Default country is India for ShypBuddy
                                landmark: "", // ShypBuddy doesn't provide landmark
                                city: shypbuddyData.data.city || "",
                            }];
                    }
                    // If no valid data is found in both APIs
                    console.warn("No data found for pincode ".concat(pincode, " in both APIs"));
                    return [2 /*return*/, { error: "Pincode not found" }];
                case 6:
                    err_1 = _c.sent();
                    // Improved error handling, return a structured error response
                    console.error("Error fetching pincode details:", err_1);
                    return [2 /*return*/, { error: "Failed to fetch pincode details", details: err_1 }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function getPinDetails(pincode) {
    return __awaiter(this, void 0, void 0, function () {
        var response, deliveryData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, pinValidator(pincode)];
                case 1:
                    response = _a.sent();
                    if (response) {
                        deliveryData = {
                            zone: response.state ? response.state.trim() : "",
                            pin: pincode,
                            district: response.district ? response.district.trim() : "",
                            state: response.state ? response.state.trim() : "",
                            Region: response.city ? response.city.trim() : "",
                        };
                        return [2 /*return*/, deliveryData];
                    }
                    else {
                        console.error("Invalid response structure for pincode:", pincode);
                        return [2 /*return*/, null];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error fetching pin details:", error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function CalculateZone(pickup, drop) {
    return __awaiter(this, void 0, void 0, function () {
        "use server";
        var SpecialZones, MetroCities, isSpecialZone, isSameState, isSameRegion, zoneName;
        return __generator(this, function (_a) {
            SpecialZones = [
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
            MetroCities = [
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
                    console.error("Pickup or drop information is missing:", { pickup: pickup, drop: drop });
                    return [2 /*return*/, { status: 500, zoneName: "No_Zone" }];
                }
                isSpecialZone = SpecialZones.some(function (zone) { return pickup.state.includes(zone) || drop.state.includes(zone); });
                isSameState = pickup.state === drop.state;
                isSameRegion = pickup.Region === drop.Region;
                if (pickup.state == drop.state) {
                    console.log("Same State: ", pickup.state, drop.state);
                }
                zoneName = void 0;
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
                return [2 /*return*/, { status: 200, zoneName: zoneName }];
            }
            catch (error) {
                console.log("An error occured in rateCalulator,ts line 71: ", error);
                return [2 /*return*/, { status: 500, zoneName: "No_Zone" }];
            }
            return [2 /*return*/];
        });
    });
}
function findServiceablePartners(data) {
    return __awaiter(this, void 0, void 0, function () {
        var pickupServiceablePartners, deliveryServiceablePartners_1, pickupPincodeData, deliveryPincodeData, pickupPincodeData, deliveryPincodeData, commonServiceablePartners, index, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    pickupServiceablePartners = void 0;
                    if (!data.isReverse) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma_1.default.deliveryPincode.findUnique({
                            where: { Pincode: data.pickupPin },
                        })];
                case 1:
                    pickupPincodeData = _a.sent();
                    if (!pickupPincodeData) {
                        console.error("Pickup pincode ".concat(data.pickupPin, " not found in delivery pincode table"));
                        return [2 /*return*/, []];
                    }
                    pickupServiceablePartners = pickupPincodeData.Rev;
                    return [4 /*yield*/, prisma_1.default.pickupPincode.findUnique({
                            where: { Pincode: data.deliveryPin },
                        })];
                case 2:
                    deliveryPincodeData = _a.sent();
                    if (!deliveryPincodeData) {
                        console.error("Delivery pincode ".concat(data.deliveryPin, " not found in pickup pincode table"));
                        return [2 /*return*/, []];
                    }
                    deliveryServiceablePartners_1 = deliveryPincodeData.Serviceable;
                    return [3 /*break*/, 6];
                case 3: return [4 /*yield*/, prisma_1.default.pickupPincode.findUnique({
                        where: { Pincode: data.pickupPin },
                    })];
                case 4:
                    pickupPincodeData = _a.sent();
                    if (!pickupPincodeData) {
                        console.error("Pickup pincode ".concat(data.pickupPin, " not found in pickup pincode table"));
                        return [2 /*return*/, []];
                    }
                    pickupServiceablePartners = pickupPincodeData.Serviceable;
                    return [4 /*yield*/, prisma_1.default.deliveryPincode.findUnique({
                            where: { Pincode: data.deliveryPin },
                        })];
                case 5:
                    deliveryPincodeData = _a.sent();
                    if (!deliveryPincodeData) {
                        console.error("Delivery pincode ".concat(data.deliveryPin, " not found in delivery pincode table"));
                        return [2 /*return*/, []];
                    }
                    if (data.paymentType === "cod") {
                        deliveryServiceablePartners_1 = deliveryPincodeData.Cod;
                    }
                    else {
                        deliveryServiceablePartners_1 = deliveryPincodeData.Serviceable;
                    }
                    _a.label = 6;
                case 6:
                    commonServiceablePartners = pickupServiceablePartners.filter(function (partner) { return deliveryServiceablePartners_1.includes(partner); });
                    console.log("type aman: new", data);
                    if (data.paymentType.toLowerCase() === "prepaid") {
                        index = commonServiceablePartners.indexOf("bluedart");
                        if (index > -1) {
                            commonServiceablePartners.splice(index, 1);
                        }
                    }
                    return [2 /*return*/, commonServiceablePartners];
                case 7:
                    error_2 = _a.sent();
                    console.error("Error in findServiceablePartners:", error_2);
                    return [2 /*return*/, []];
                case 8: return [2 /*return*/];
            }
        });
    });
}
