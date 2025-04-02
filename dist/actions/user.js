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
exports.serializeDecimal = void 0;
exports.fetchUserData = fetchUserData;
exports.getUserPartnerPreferences = getUserPartnerPreferences;
const prisma_1 = __importDefault(require("../lib/prisma"));
const library_1 = require("@prisma/client/runtime/library");
function fetchUserData(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // const startTime = Date.now();
        var _a, _b;
        try {
            const userRole = yield prisma_1.default.users.findUnique({
                where: {
                    userid: userId,
                },
                select: {
                    userid: true,
                    email: true,
                    fullname: true,
                    phone: true,
                    kyc: true,
                    buddyShield: true,
                    negotiation: true,
                    paymentMethod: true,
                    cardLimit: true,
                    specialRatesEnabled: true,
                    PaymentSheet: true,
                    partnerPreferences: true,
                    earlyCod: true,
                    StoreName: true,
                },
            });
            if (!userRole) {
                return null;
            }
            const user = {
                userid: userRole.userid,
                email: userRole.email,
                fullname: userRole.fullname,
                phone: userRole.phone,
                kyc: userRole.kyc,
                buddyShield: userRole.buddyShield,
                negotiation: userRole.negotiation,
                paymentMethod: userRole.paymentMethod,
                cardLimit: (_a = userRole.cardLimit) === null || _a === void 0 ? void 0 : _a.toNumber(),
                specialRatesEnabled: userRole.specialRatesEnabled,
                PaymentSheet: userRole.PaymentSheet,
                partnerPreferences: userRole.partnerPreferences,
                earlyCod: (_b = userRole.earlyCod) === null || _b === void 0 ? void 0 : _b.toNumber(),
                storeName: userRole.StoreName,
                userPreferences: userRole.partnerPreferences,
            };
            // const endTime = Date.now();
            // const totalTime = (endTime - startTime) / 1000;
            // console.log(`⏱️ Fetched user data in ${totalTime} seconds`);
            return (0, exports.serializeDecimal)(user);
        }
        catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    });
}
const serializeDecimal = (obj) => {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (obj instanceof library_1.Decimal) {
        return obj.toNumber(); // or obj.toString() if you need to preserve precision
    }
    if (Array.isArray(obj)) {
        return obj.map(exports.serializeDecimal);
    }
    if (typeof obj === "object") {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, (0, exports.serializeDecimal)(value)]));
    }
    return obj;
};
exports.serializeDecimal = serializeDecimal;
function getUserPartnerPreferences(currentUser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (currentUser === null || currentUser === void 0 ? void 0 : currentUser.partnerPreferences) {
            try {
                const preferences = JSON.parse(currentUser.partnerPreferences);
                // console.log(`✅ Found ${preferences.length} partner preferences`);
                return preferences.map((pref) => pref.partnerName.toLowerCase());
            }
            catch (error) {
                console.error("❌ Error parsing partner preferences:", error);
                return [];
            }
        }
        console.log("⚠️ No partner preferences found");
        return [];
    });
}
