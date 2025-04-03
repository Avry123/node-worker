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
exports.serializeDecimal = void 0;
exports.fetchUserData = fetchUserData;
exports.getUserPartnerPreferences = getUserPartnerPreferences;
var prisma_1 = require("../lib/prisma");
var library_1 = require("@prisma/client/runtime/library");
function fetchUserData(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var userRole, user, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_1.default.users.findUnique({
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
                        })];
                case 1:
                    userRole = _c.sent();
                    if (!userRole) {
                        return [2 /*return*/, null];
                    }
                    user = {
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
                    return [2 /*return*/, (0, exports.serializeDecimal)(user)];
                case 2:
                    error_1 = _c.sent();
                    console.error("Error fetching user data:", error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
var serializeDecimal = function (obj) {
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
        return Object.fromEntries(Object.entries(obj).map(function (_a) {
            var key = _a[0], value = _a[1];
            return [key, (0, exports.serializeDecimal)(value)];
        }));
    }
    return obj;
};
exports.serializeDecimal = serializeDecimal;
function getUserPartnerPreferences(currentUser) {
    return __awaiter(this, void 0, void 0, function () {
        var preferences;
        return __generator(this, function (_a) {
            if (currentUser === null || currentUser === void 0 ? void 0 : currentUser.partnerPreferences) {
                try {
                    preferences = JSON.parse(currentUser.partnerPreferences);
                    // console.log(`✅ Found ${preferences.length} partner preferences`);
                    return [2 /*return*/, preferences.map(function (pref) { return pref.partnerName.toLowerCase(); })];
                }
                catch (error) {
                    console.error("❌ Error parsing partner preferences:", error);
                    return [2 /*return*/, []];
                }
            }
            console.log("⚠️ No partner preferences found");
            return [2 /*return*/, []];
        });
    });
}
