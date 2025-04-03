"use server";
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.getDeliveryPartnerToken = getDeliveryPartnerToken;
var axios_1 = require("axios");
var TokenManager = /** @class */ (function () {
    function TokenManager() {
        this.token = null;
        this.tokenExpiration = null;
    }
    TokenManager.prototype.isTokenValid = function () {
        if (!this.token || !this.tokenExpiration) {
            return false;
        }
        return this.tokenExpiration.getTime() > Date.now() + 5 * 60 * 1000; // 5 minutes buffer
    };
    TokenManager.prototype.getToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.isTokenValid()) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.generateToken()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.token];
                }
            });
        });
    };
    return TokenManager;
}());
var XpressBeesTokenManager = /** @class */ (function (_super) {
    __extends(XpressBeesTokenManager, _super);
    function XpressBeesTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    XpressBeesTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.post("https://shipment.xpressbees.com/api/users/login", {
                                email: process.env.XPRESSBEES_EMAIL,
                                password: process.env.XPRESSBEES_PASSWORD,
                            })];
                    case 1:
                        authResponse = _a.sent();
                        this.token = authResponse.data.data;
                        this.tokenExpiration = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours expiration
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Error generating XpressBees token:", error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return XpressBeesTokenManager;
}(TokenManager));
var SmartrTokenManager = /** @class */ (function (_super) {
    __extends(SmartrTokenManager, _super);
    function SmartrTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SmartrTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.post("https://api.smartr.in/api/v1/get-token/", {
                                username: process.env.SMARTR_USERNAME,
                                password: process.env.SMARTR_PASSWORD,
                            })];
                    case 1:
                        authResponse = _a.sent();
                        this.token = authResponse.data.data.access_token;
                        this.tokenExpiration = new Date(Date.now() + 10 * 60 * 60 * 1000); // 10 hours expiration
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error("Error generating Smartr token:", error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return SmartrTokenManager;
}(TokenManager));
var EkartTokenManager = /** @class */ (function (_super) {
    __extends(EkartTokenManager, _super);
    function EkartTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EkartTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.post("https://api.ekartlogistics.com/auth/token?", {}, {
                                headers: {
                                    Authorization: "Basic ".concat(process.env.EKART_AUTH_TOKEN),
                                    "Content-Type": "application/json",
                                    HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
                                },
                            })];
                    case 1:
                        authResponse = _a.sent();
                        this.token = authResponse.data.Authorization;
                        this.tokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hours expiration
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error("Error generating Ekart token:", error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return EkartTokenManager;
}(TokenManager));
var DtdcTokenManager = /** @class */ (function (_super) {
    __extends(DtdcTokenManager, _super);
    function DtdcTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DtdcTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.token = process.env.DTDC_TOKEN;
                }
                catch (error) {
                    console.error("Invalid Dtdc token:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return DtdcTokenManager;
}(TokenManager));
var ShadowfaxTokenManager = /** @class */ (function (_super) {
    __extends(ShadowfaxTokenManager, _super);
    function ShadowfaxTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ShadowfaxTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.token = process.env.SHADOWFAX_TOKEN;
                }
                catch (error) {
                    console.error("Invalid ShadowFax token:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return ShadowfaxTokenManager;
}(TokenManager));
var ShadowfaxSDDTokenManager = /** @class */ (function (_super) {
    __extends(ShadowfaxSDDTokenManager, _super);
    function ShadowfaxSDDTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ShadowfaxSDDTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.token = process.env.SHADOWFAXSDD_TOKEN;
                }
                catch (error) {
                    console.error("Invalid ShadowFax SDD token:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return ShadowfaxSDDTokenManager;
}(TokenManager));
var DelhiveryTokenManager = /** @class */ (function (_super) {
    __extends(DelhiveryTokenManager, _super);
    function DelhiveryTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DelhiveryTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.token = process.env.DELHIVERY_TOKEN;
                }
                catch (error) {
                    console.error("Invalid Delhivery token:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return DelhiveryTokenManager;
}(TokenManager));
var DelhiveryAirTokenManager = /** @class */ (function (_super) {
    __extends(DelhiveryAirTokenManager, _super);
    function DelhiveryAirTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DelhiveryAirTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.token = process.env.DELHIVERYAIR_TOKEN;
                }
                catch (error) {
                    console.error("Invalid Delhivery token:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return DelhiveryAirTokenManager;
}(TokenManager));
var Delhivery5kgTokenManager = /** @class */ (function (_super) {
    __extends(Delhivery5kgTokenManager, _super);
    function Delhivery5kgTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Delhivery5kgTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.token = process.env.DELHIVERY5KG_TOKEN;
                }
                catch (error) {
                    console.error("Invalid Delhivery token:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return Delhivery5kgTokenManager;
}(TokenManager));
var Delhivery10kgTokenManager = /** @class */ (function (_super) {
    __extends(Delhivery10kgTokenManager, _super);
    function Delhivery10kgTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Delhivery10kgTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.token = process.env.DELHIVERY10KG_TOKEN;
                }
                catch (error) {
                    console.error("Invalid Delhivery token:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return Delhivery10kgTokenManager;
}(TokenManager));
var Delhivery20kgTokenManager = /** @class */ (function (_super) {
    __extends(Delhivery20kgTokenManager, _super);
    function Delhivery20kgTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Delhivery20kgTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.token = process.env.DELHIVERY20KG_TOKEN;
                }
                catch (error) {
                    console.error("Invalid Delhivery token:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return Delhivery20kgTokenManager;
}(TokenManager));
var AtsTokenManager = /** @class */ (function (_super) {
    __extends(AtsTokenManager, _super);
    function AtsTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AtsTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.post("https://api.amazon.com/auth/o2/token", {
                                grant_type: "refresh_token",
                                refresh_token: process.env.ATS_REFRESH_TOKEN,
                                client_id: process.env.ATS_CLIENT_ID,
                                client_secret: process.env.ATS_CLIENT_SECRET,
                            }, {
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                },
                            })];
                    case 1:
                        authResponse = _a.sent();
                        this.token = authResponse.data.access_token;
                        this.tokenExpiration = new Date(Date.now() + authResponse.data.expires_in * 1000); // 1 hours expiration (3600 seconds)
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Error generating ATS token:", error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return AtsTokenManager;
}(TokenManager));
var BlueDart_Air = /** @class */ (function (_super) {
    __extends(BlueDart_Air, _super);
    function BlueDart_Air() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BlueDart_Air.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Blue Dart Air");
                        return [4 /*yield*/, axios_1.default.get("https://apigateway.bluedart.com/in/transportation/token/v1/login", {
                                headers: {
                                    ClientID: "jvGvrGgVG0tjU7yWqpHevxkubUUocxpH",
                                    clientSecret: "IQ4LkQGgXa0VnZC8",
                                },
                            })];
                    case 1:
                        authResponse = _a.sent();
                        // console.log(authResponse," bluedart air token");
                        this.token = authResponse.data.JWTToken;
                        this.tokenExpiration = new Date(Date.now() + authResponse.data.expires_in * 1000);
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error("Error generating SmartShip token:", error_5);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return BlueDart_Air;
}(TokenManager));
var SmartShipTokenManager = /** @class */ (function (_super) {
    __extends(SmartShipTokenManager, _super);
    function SmartShipTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SmartShipTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Smart ship lin2");
                        console.log(process.env.SMARTSHIP_USERNAME, " line 190");
                        return [4 /*yield*/, axios_1.default.post("https://oauth.smartship.in/loginToken.php", {
                                username: "" + process.env.SMARTSHIP_USERNAME + "",
                                password: "" + process.env.SMARTSHIP_PASSWORD + "",
                                client_id: "" + process.env.SMARTSHIP_CLIENT_ID + "",
                                client_secret: "7Z*6F!&7IRWVJTW_B#$Z7L7",
                                grant_type: "password",
                            }, {
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            })];
                    case 1:
                        authResponse = _a.sent();
                        this.token = authResponse.data.access_token;
                        this.tokenExpiration = new Date(Date.now() + authResponse.data.expires_in * 1000); // 1 hours expiration (3600 seconds)
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        console.error("Error generating SmartShip token:");
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return SmartShipTokenManager;
}(TokenManager));
var OnlineXpressTokenManager = /** @class */ (function (_super) {
    __extends(OnlineXpressTokenManager, _super);
    function OnlineXpressTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    OnlineXpressTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.token = "83281572da57c6ce5ffe9889183ab444";
                }
                catch (error) {
                    console.error("Invalid OnlineXpress token:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return OnlineXpressTokenManager;
}(TokenManager));
var AbhilayaTokenManager = /** @class */ (function (_super) {
    __extends(AbhilayaTokenManager, _super);
    function AbhilayaTokenManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AbhilayaTokenManager.prototype.generateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Generating Abhilaya test token...");
                        return [4 /*yield*/, axios_1.default.post("https://oneworld.isopronto.com/token", {
                                grant_type: "password",
                                username: process.env.ABHILAYA_USERNAME,
                                password: process.env.ABHILAYA_PASSWORD,
                            }, {
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                },
                            })];
                    case 1:
                        authResponse = _a.sent();
                        this.token = authResponse.data.access_token;
                        this.tokenExpiration = new Date(Date.now() + authResponse.data.expires_in * 1000);
                        console.log("Abhilaya test token generated successfully.");
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        console.error("Error generating Abhilaya test token:", error_7);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return AbhilayaTokenManager;
}(TokenManager));
var TokenManagerFactory = /** @class */ (function () {
    function TokenManagerFactory() {
    }
    TokenManagerFactory.getTokenManager = function (partner) {
        var manager = this.managers[partner];
        if (!manager) {
            console.error("No token manager found for partner: ".concat(partner));
        }
        return manager;
    };
    TokenManagerFactory.managers = {
        xpressbees: new XpressBeesTokenManager(),
        smartr: new SmartrTokenManager(),
        ekart: new EkartTokenManager(),
        dtdc: new DtdcTokenManager(),
        delhivery: new DelhiveryTokenManager(),
        delhiveryair: new DelhiveryAirTokenManager(),
        delhivery5kg: new Delhivery5kgTokenManager(),
        delhivery10kg: new Delhivery10kgTokenManager(),
        delhivery20kg: new Delhivery20kgTokenManager(),
        shadowfax: new ShadowfaxTokenManager(),
        shadowfaxsdd: new ShadowfaxSDDTokenManager(),
        ats: new AtsTokenManager(),
        smartship: new SmartShipTokenManager(),
        bluedart_air: new BlueDart_Air(),
        abhilaya: new AbhilayaTokenManager(),
        onlinexpress: new OnlineXpressTokenManager(),
    };
    return TokenManagerFactory;
}());
function getDeliveryPartnerToken(partner) {
    return __awaiter(this, void 0, void 0, function () {
        var tokenManager;
        return __generator(this, function (_a) {
            tokenManager = TokenManagerFactory.getTokenManager(partner.toLowerCase());
            return [2 /*return*/, tokenManager.getToken()];
        });
    });
}
