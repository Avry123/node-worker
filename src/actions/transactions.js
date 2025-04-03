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
exports.getuserBalance = getuserBalance;
exports.OrderBalanceApi = OrderBalanceApi;
exports.OrderDeductionApi = OrderDeductionApi;
exports.OrderRefundAPI = OrderRefundAPI;
exports.Order_Wallet = Order_Wallet;
exports.Order_Credits = Order_Credits;
exports.Order_Card = Order_Card;
exports.Combo_WC = Combo_WC;
exports.Combo_CC = Combo_CC;
exports.Combo_WCA = Combo_WCA;
exports.Combo_WCCA = Combo_WCCA;
exports.Refund_WCCA = Refund_WCCA;
exports.Refund_Wallet = Refund_Wallet;
exports.Refund_Credits = Refund_Credits;
exports.Refund_Card = Refund_Card;
exports.Refund_WC = Refund_WC;
exports.Refund_CC = Refund_CC;
exports.Refund_WCA = Refund_WCA;
var prisma_1 = require("../lib/prisma");
function getuserBalance(user) {
    return __awaiter(this, void 0, void 0, function () {
        var InitialBal, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!user) {
                        return [2 /*return*/, { status: 500, data: 0 }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma_1.default.wallet.findFirst({
                            where: {
                                userId: user.userID,
                            },
                            orderBy: {
                                transactionDate: "desc",
                            },
                        })];
                case 2:
                    InitialBal = _a.sent();
                    console.log("User id in balance: ", InitialBal === null || InitialBal === void 0 ? void 0 : InitialBal.balance);
                    if (InitialBal === null) {
                        return [2 /*return*/, { status: 200, data: 0 }];
                    }
                    else {
                        return [2 /*return*/, { status: 200, data: InitialBal.balance }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    return [2 /*return*/, { status: 500, data: 0 }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function OrderBalanceApi(orderValue, id, userId, BulkUser) {
    return __awaiter(this, void 0, void 0, function () {
        var balance, walletBalance, CreditBalance, CardBalance, ModeofPayment, Combo_Balance, credits, cardLimit;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getuserBalance(userId)];
                case 1:
                    balance = _a.sent();
                    console.log(balance.data, "line 193 ", orderValue);
                    walletBalance = 0;
                    CreditBalance = 0;
                    CardBalance = 0;
                    ModeofPayment = "";
                    Combo_Balance = "";
                    if (!(!balance || Number(balance.data) < orderValue)) return [3 /*break*/, 9];
                    // console.log("wallet not sufficient line 1638");
                    walletBalance = !balance ? 0 : Number(balance.data);
                    return [4 /*yield*/, prisma_1.default.credits.findFirst({
                            where: {
                                userId: userId,
                            },
                            orderBy: {
                                transactionDate: "desc",
                            },
                            select: {
                                balance: true,
                            },
                        })];
                case 2:
                    credits = _a.sent();
                    if (!(!credits || Number(credits.balance) < orderValue)) return [3 /*break*/, 7];
                    CreditBalance = !credits ? 0 : Number(credits.balance);
                    return [4 /*yield*/, prisma_1.default.card_Limit.findFirst({
                            where: {
                                userId: userId,
                            },
                            orderBy: {
                                transactionDate: "desc",
                            },
                            select: {
                                balance: true,
                            },
                        })];
                case 3:
                    cardLimit = _a.sent();
                    if (!(!cardLimit || Number(cardLimit.balance) < orderValue)) return [3 /*break*/, 4];
                    CardBalance = !cardLimit ? 0 : Number(cardLimit.balance);
                    if (walletBalance + CreditBalance >= orderValue) {
                        ModeofPayment =
                            walletBalance <= CreditBalance
                                ? "WALLET_CREDITS"
                                : "CREDITS_WALLET";
                        Combo_Balance =
                            walletBalance <= CreditBalance
                                ? [walletBalance.toString(), CreditBalance.toString()].join("_")
                                : [CreditBalance.toString(), walletBalance.toString()].join("_");
                        return [2 /*return*/, {
                                status: "OK",
                                message: "Balance Sufficient",
                                Mode: ModeofPayment,
                                balance: Combo_Balance,
                            }];
                    }
                    else {
                        if (CreditBalance + CardBalance >= orderValue) {
                            ModeofPayment =
                                CreditBalance <= CardBalance ? "CREDITS_CARD" : "CARD_CREDITS";
                            Combo_Balance =
                                CreditBalance <= CardBalance
                                    ? [CreditBalance.toString(), CardBalance.toString()].join("_")
                                    : [CardBalance.toString(), CreditBalance.toString()].join("_");
                            return [2 /*return*/, {
                                    status: "OK",
                                    message: "Balance Sufficient",
                                    Mode: ModeofPayment,
                                    balance: Combo_Balance,
                                }];
                        }
                        else {
                            if (walletBalance + CardBalance >= orderValue) {
                                ModeofPayment =
                                    walletBalance <= CardBalance ? "WALLET_CARD" : "CARD_WALLET";
                                Combo_Balance =
                                    walletBalance <= CardBalance
                                        ? [walletBalance.toString(), CardBalance.toString()].join("_")
                                        : [CardBalance.toString(), walletBalance.toString()].join("_");
                                return [2 /*return*/, {
                                        status: "OK",
                                        message: "Balance Sufficient",
                                        Mode: ModeofPayment,
                                        balance: Combo_Balance,
                                    }];
                            }
                            else if (walletBalance + CardBalance + CreditBalance >=
                                orderValue) {
                                if (walletBalance >= CreditBalance &&
                                    CreditBalance >= CardBalance) {
                                    ModeofPayment = "CARD_CREDIT_WALLET";
                                    Combo_Balance = [
                                        CardBalance.toString(),
                                        CreditBalance.toString(),
                                        walletBalance.toString(),
                                    ].join("_");
                                }
                                else if (CreditBalance >= CardBalance &&
                                    CardBalance >= walletBalance) {
                                    ModeofPayment = "WALLET_CARD_CREDIT";
                                    Combo_Balance = [
                                        walletBalance.toString(),
                                        CardBalance.toString(),
                                        CreditBalance.toString(),
                                    ].join("_");
                                }
                                else if (CardBalance >= walletBalance &&
                                    walletBalance >= CreditBalance) {
                                    ModeofPayment = "CREDIT_WALLET_CARD";
                                    Combo_Balance = [
                                        CreditBalance.toString(),
                                        walletBalance.toString(),
                                        CardBalance.toString(),
                                    ].join("_");
                                }
                                else if (CreditBalance >= walletBalance &&
                                    walletBalance >= CardBalance) {
                                    ModeofPayment = "CARD_WALLET_CREDIT";
                                    Combo_Balance = [
                                        CardBalance.toString(),
                                        walletBalance.toString(),
                                        CreditBalance.toString(),
                                    ].join("_");
                                }
                                else if (walletBalance >= CardBalance &&
                                    CardBalance >= CreditBalance) {
                                    ModeofPayment = "WALLET_CREDIT_CARD";
                                    Combo_Balance = [
                                        walletBalance.toString(),
                                        CreditBalance.toString(),
                                        CardBalance.toString(),
                                    ].join("_");
                                }
                                else if (CardBalance >= CreditBalance &&
                                    CreditBalance >= walletBalance) {
                                    ModeofPayment = "CREDIT_CARD_WALLET";
                                    Combo_Balance = [
                                        CreditBalance.toString(),
                                        CardBalance.toString(),
                                        walletBalance.toString(),
                                    ].join("_");
                                }
                                return [2 /*return*/, {
                                        status: "OK",
                                        message: "Balance Sufficient",
                                        Mode: ModeofPayment,
                                        balance: Combo_Balance,
                                    }];
                            }
                            else {
                                return [2 /*return*/, {
                                        status: "FAILED",
                                        message: "Insufficient Balance in cardLimit",
                                        Mode: "",
                                        balance: "none",
                                    }];
                            }
                        }
                    }
                    return [3 /*break*/, 6];
                case 4: 
                // console.log("CardLimit sufficient line 1638");
                return [4 /*yield*/, prisma_1.default.orders.update({
                        where: {
                            id: id,
                        },
                        data: {
                            payedBy: "CARD",
                        },
                    })];
                case 5:
                    // console.log("CardLimit sufficient line 1638");
                    _a.sent();
                    // console.log("Card sufficient line 1638");
                    return [2 /*return*/, {
                            status: "OK",
                            message: "Balance Sufficient",
                            Mode: "CARD",
                            balance: cardLimit.balance.toString(),
                        }];
                case 6: return [3 /*break*/, 8];
                case 7: 
                // console.log("Credits sufficient line 1638");
                return [2 /*return*/, {
                        status: "OK",
                        message: "Balance Sufficient",
                        Mode: "CREDITS",
                        balance: credits.balance.toString(),
                    }];
                case 8: return [3 /*break*/, 10];
                case 9: 
                // console.log("Wallet sufficient line 1638");
                return [2 /*return*/, {
                        status: "OK",
                        message: "Balance Sufficient",
                        Mode: "WALLET",
                        balance: balance.data.toString(),
                    }];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function OrderDeductionApi(orderValue, orderId, awbNumber, Mode, Userbalance, userId, BulkUser) {
    return __awaiter(this, void 0, void 0, function () {
        var userData, first_from, first_balance, Deduction_Object, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, prisma_1.default.users.findUnique({
                        where: {
                            userid: userId
                        }, select: {
                            fullname: true,
                        }
                    })];
                case 1:
                    userData = _b.sent();
                    if (!userData) {
                        return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                    }
                    first_from = [];
                    first_balance = [];
                    if (Mode.includes("_")) {
                        first_from = Mode.split("_");
                        first_balance = Userbalance.split("_");
                    }
                    Deduction_Object = {
                        userID: userId,
                        fullname: userData.fullname,
                        OrderValue: orderValue,
                        UserBalance: Userbalance,
                        OrderID: orderId,
                        AWB: awbNumber,
                        Deduction_Mode: Mode.includes("_") ? first_from[0] : Mode,
                        Deduction_Mode2: Mode.includes("_") ? first_from[1] : "None",
                        Balance_1: Mode.includes("_") ? first_balance[0] : Userbalance,
                        Balance_2: Mode.includes("_") ? first_balance[1] : "0",
                        Balance_3: Mode.includes("_") ? first_balance[2] : "0",
                        Amount_1: "0",
                        Amount_2: "0",
                        Amount_3: "0",
                    };
                    _a = Mode;
                    switch (_a) {
                        case "WALLET": return [3 /*break*/, 2];
                        case "CREDITS": return [3 /*break*/, 4];
                        case "CARD": return [3 /*break*/, 6];
                        case "WALLET_CREDITS": return [3 /*break*/, 8];
                        case "CREDITS_WALLET": return [3 /*break*/, 8];
                        case "CREDITS_CARD": return [3 /*break*/, 10];
                        case "CARD_CREDITS": return [3 /*break*/, 10];
                        case "WALLET_CARD": return [3 /*break*/, 12];
                        case "CARD_WALLET": return [3 /*break*/, 12];
                        case "CARD_CREDIT_WALLET": return [3 /*break*/, 14];
                        case "CARD_WALLET_CREDIT": return [3 /*break*/, 14];
                        case "CREDIT_CARD_WALLET": return [3 /*break*/, 14];
                        case "WALLET_CARD_CREDIT": return [3 /*break*/, 14];
                        case "WALLET_CREDIT_CARD": return [3 /*break*/, 14];
                        case "CREDIT_WALLET_CARD": return [3 /*break*/, 14];
                    }
                    return [3 /*break*/, 16];
                case 2: 
                // console.log("Wallet Case");
                return [4 /*yield*/, Order_Wallet(Deduction_Object)];
                case 3:
                    // console.log("Wallet Case");
                    _b.sent();
                    return [3 /*break*/, 16];
                case 4: 
                // console.log("Credits Case");
                return [4 /*yield*/, Order_Credits(Deduction_Object)];
                case 5:
                    // console.log("Credits Case");
                    _b.sent();
                    return [3 /*break*/, 16];
                case 6: return [4 /*yield*/, Order_Card(Deduction_Object)];
                case 7:
                    _b.sent();
                    // console.log("Card Case");
                    return [3 /*break*/, 16];
                case 8: 
                // console.log("Combo Case");
                return [4 /*yield*/, Combo_WC(Deduction_Object)];
                case 9:
                    // console.log("Combo Case");
                    _b.sent();
                    return [3 /*break*/, 16];
                case 10: 
                // console.log("Combo Case credits");
                return [4 /*yield*/, Combo_CC(Deduction_Object)];
                case 11:
                    // console.log("Combo Case credits");
                    _b.sent();
                    return [3 /*break*/, 16];
                case 12: 
                // console.log("COmbo case deduction WCA");
                return [4 /*yield*/, Combo_WCA(Deduction_Object)];
                case 13:
                    // console.log("COmbo case deduction WCA");
                    _b.sent();
                    return [3 /*break*/, 16];
                case 14: 
                // console.log("COmbo case deduction WCCA");
                return [4 /*yield*/, Combo_WCCA(Deduction_Object)];
                case 15:
                    // console.log("COmbo case deduction WCCA");
                    _b.sent();
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/, { status: "OK" }];
            }
        });
    });
}
function OrderRefundAPI(orderRate, orderID, awb, Payed_By, Combo_Amount, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var userDetails, balance, creditBalance, cardBalance, RefundAmount, Deduction_Mode, first_from, Refund_Object, _a, cards, credits, wallet, remaningValues;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, prisma_1.default.users.findUnique({
                        where: {
                            userid: userId
                        }, select: {
                            fullname: true,
                            userid: true,
                        }
                    })];
                case 1:
                    userDetails = _b.sent();
                    if (!userDetails) {
                        return [2 /*return*/, { status: "Not OK" }];
                    }
                    Deduction_Mode = [];
                    first_from = [];
                    console.log("i am last here", Combo_Amount, " ", Payed_By);
                    if (Combo_Amount && Combo_Amount.includes("_")) {
                        // console.log("i am last here line 293");
                        first_from = Combo_Amount.split("_");
                    }
                    if (Payed_By.includes("_")) {
                        Deduction_Mode = Payed_By.split("_");
                    }
                    Refund_Object = {
                        userID: userDetails.userid,
                        fullname: userDetails.fullname,
                        OrderValue: orderRate,
                        UserBalance: balance,
                        OrderID: orderID,
                        AWB: awb,
                        Deduction_Mode: Payed_By.includes("_") ? Deduction_Mode[0] : Payed_By,
                        Deduction_Mode2: Payed_By.includes("_") ? Deduction_Mode[1] : "0",
                        Balance_1: "0",
                        Balance_2: "0",
                        Balance_3: "0",
                        Amount_1: Combo_Amount && Combo_Amount.includes("_") ? first_from[0] : "0",
                        Amount_2: Combo_Amount && Combo_Amount.includes("_") ? first_from[1] : "0",
                        Amount_3: Combo_Amount && Combo_Amount.includes("_") ? first_from[2] : "0",
                    };
                    _a = Payed_By;
                    switch (_a) {
                        case "WALLET": return [3 /*break*/, 2];
                        case "CREDITS": return [3 /*break*/, 5];
                        case "CARD": return [3 /*break*/, 8];
                        case "WALLET_CREDITS": return [3 /*break*/, 11];
                        case "CREDITS_WALLET": return [3 /*break*/, 11];
                        case "CREDITS_CARD": return [3 /*break*/, 15];
                        case "CARD_CREDITS": return [3 /*break*/, 15];
                        case "WALLET_CARD": return [3 /*break*/, 19];
                        case "CARD_WALLET": return [3 /*break*/, 19];
                        case "CARD_CREDIT_WALLET": return [3 /*break*/, 23];
                        case "CARD_WALLET_CREDIT": return [3 /*break*/, 23];
                        case "CREDIT_CARD_WALLET": return [3 /*break*/, 23];
                        case "WALLET_CARD_CREDIT": return [3 /*break*/, 23];
                        case "WALLET_CREDIT_CARD": return [3 /*break*/, 23];
                        case "CREDIT_WALLET_CARD": return [3 /*break*/, 23];
                    }
                    return [3 /*break*/, 28];
                case 2: return [4 /*yield*/, prisma_1.default.wallet.findFirst({
                        where: {
                            userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                        },
                        orderBy: {
                            transactionDate: "desc",
                        },
                        select: {
                            balance: true,
                        },
                    })];
                case 3:
                    // console.log("Wallet Refund");
                    balance = _b.sent();
                    Refund_Object.UserBalance = !balance ? "" : balance.balance.toString();
                    return [4 /*yield*/, Refund_Wallet(Refund_Object)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 28];
                case 5: return [4 /*yield*/, prisma_1.default.credits.findFirst({
                        where: {
                            userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                        },
                        orderBy: {
                            transactionDate: "desc",
                        },
                        select: {
                            balance: true,
                        },
                    })];
                case 6:
                    // console.log("CREDITS Refund");
                    balance = _b.sent();
                    Refund_Object.UserBalance = !balance ? "" : balance.balance.toString();
                    return [4 /*yield*/, Refund_Credits(Refund_Object)];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 28];
                case 8: return [4 /*yield*/, prisma_1.default.card_Limit.findFirst({
                        where: {
                            userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                        },
                        orderBy: {
                            transactionDate: "desc",
                        },
                        select: {
                            balance: true,
                        },
                    })];
                case 9:
                    // console.log("CARD Refund");
                    balance = _b.sent();
                    Refund_Object.UserBalance = !balance ? "" : balance.balance.toString();
                    return [4 /*yield*/, Refund_Card(Refund_Object)];
                case 10:
                    _b.sent();
                    return [3 /*break*/, 28];
                case 11: return [4 /*yield*/, prisma_1.default.credits.findFirst({
                        where: {
                            userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                        },
                        orderBy: {
                            transactionDate: "desc",
                        },
                        select: {
                            balance: true,
                        },
                    })];
                case 12:
                    // console.log("Combo Case WC");
                    creditBalance = _b.sent();
                    return [4 /*yield*/, prisma_1.default.wallet.findFirst({
                            where: {
                                userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                            },
                            orderBy: {
                                transactionDate: "desc",
                            },
                            select: {
                                balance: true,
                            },
                        })];
                case 13:
                    balance = _b.sent();
                    first_from = Payed_By.split("_");
                    RefundAmount = Combo_Amount.split("_");
                    if (first_from[0] == "WALLET") {
                        Refund_Object.Balance_1 = balance.balance;
                        Refund_Object.Balance_2 = creditBalance.balance;
                        Refund_Object.Amount_1 = RefundAmount[0];
                        Refund_Object.Amount_2 = RefundAmount[1];
                    }
                    else {
                        Refund_Object.Balance_1 = creditBalance.balance;
                        Refund_Object.Balance_2 = balance.balance;
                        Refund_Object.Amount_1 = RefundAmount[0];
                        Refund_Object.Amount_2 = RefundAmount[1];
                    }
                    return [4 /*yield*/, Refund_WC(Refund_Object)];
                case 14:
                    _b.sent();
                    return [3 /*break*/, 28];
                case 15: return [4 /*yield*/, prisma_1.default.card_Limit.findFirst({
                        where: {
                            userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                        },
                        orderBy: {
                            transactionDate: "desc",
                        },
                        select: {
                            balance: true,
                        },
                    })];
                case 16:
                    // console.log("Combo Case CC");
                    cardBalance = _b.sent();
                    return [4 /*yield*/, prisma_1.default.credits.findFirst({
                            where: {
                                userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                            },
                            orderBy: {
                                transactionDate: "desc",
                            },
                            select: {
                                balance: true,
                            },
                        })];
                case 17:
                    creditBalance = _b.sent();
                    first_from = Payed_By.split("_");
                    RefundAmount = Combo_Amount.split("_");
                    if (first_from[0] == "CREDITS") {
                        Refund_Object.Balance_1 = creditBalance.balance;
                        Refund_Object.Balance_2 = cardBalance.balance;
                    }
                    else {
                        Refund_Object.Balance_1 = cardBalance.balance;
                        Refund_Object.Balance_2 = creditBalance.balance;
                    }
                    Refund_Object.Amount_1 = RefundAmount[0];
                    Refund_Object.Amount_2 = RefundAmount[1];
                    return [4 /*yield*/, Refund_CC(Refund_Object)];
                case 18:
                    _b.sent();
                    return [3 /*break*/, 28];
                case 19: return [4 /*yield*/, prisma_1.default.card_Limit.findFirst({
                        where: {
                            userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                        },
                        orderBy: {
                            transactionDate: "desc",
                        },
                        select: {
                            balance: true,
                        },
                    })];
                case 20:
                    // console.log("Combo Case WCA");
                    cardBalance = _b.sent();
                    return [4 /*yield*/, prisma_1.default.wallet.findFirst({
                            where: {
                                userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                            },
                            orderBy: {
                                transactionDate: "desc",
                            },
                            select: {
                                balance: true,
                            },
                        })];
                case 21:
                    balance = _b.sent();
                    balance = !balance ? 0 : balance;
                    cardBalance = !cardBalance ? 0 : cardBalance;
                    first_from = Payed_By.split("_");
                    RefundAmount = Combo_Amount.split("_");
                    if (first_from[0] == "WALLET") {
                        Refund_Object.Balance_1 = balance.balance;
                        Refund_Object.Balance_2 = cardBalance.balance;
                    }
                    else {
                        Refund_Object.Balance_1 = cardBalance.balance;
                        Refund_Object.Balance_2 = balance.balance;
                    }
                    Refund_Object.Amount_1 = RefundAmount[0];
                    Refund_Object.Amount_2 = RefundAmount[1];
                    return [4 /*yield*/, Refund_WCA(Refund_Object)];
                case 22:
                    _b.sent();
                    return [3 /*break*/, 28];
                case 23: return [4 /*yield*/, prisma_1.default.card_Limit.findFirst({
                        where: {
                            userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                        },
                        orderBy: {
                            transactionDate: "desc",
                        },
                        select: {
                            balance: true,
                        },
                    })];
                case 24:
                    cards = _b.sent();
                    return [4 /*yield*/, prisma_1.default.credits.findFirst({
                            where: {
                                userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                            },
                            orderBy: {
                                transactionDate: "desc",
                            },
                            select: {
                                balance: true,
                            },
                        })];
                case 25:
                    credits = _b.sent();
                    return [4 /*yield*/, prisma_1.default.wallet.findFirst({
                            where: {
                                userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                            },
                            orderBy: {
                                transactionDate: "desc",
                            },
                            select: {
                                balance: true,
                            },
                        })];
                case 26:
                    wallet = _b.sent();
                    remaningValues = {
                        wallet: Number(wallet === null || wallet === void 0 ? void 0 : wallet.balance),
                        credits: Number(credits === null || credits === void 0 ? void 0 : credits.balance),
                        cards: Number(cards === null || cards === void 0 ? void 0 : cards.balance),
                    };
                    return [4 /*yield*/, Refund_WCCA(Refund_Object, remaningValues)];
                case 27:
                    _b.sent();
                    return [3 /*break*/, 28];
                case 28: return [2 /*return*/, { status: "OK" }];
            }
        });
    });
}
function Order_Wallet(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_1.default.wallet.create({
                            data: {
                                userId: Params.userID,
                                TransactionId: "",
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Params.OrderValue,
                                creditedAmount: 0,
                                balance: Number(Params.UserBalance) - Params.OrderValue,
                                ModeOfPayment: "ShypBUDDY WALLET",
                                description: "Order Deduction from Wallet",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 1:
                    data = _a.sent();
                    // // console.log(
                    //   Params.OrderID,
                    //   ": ",
                    //   " Before Deduction Balance: ",
                    //   Params.UserBalance,
                    // );
                    // console.log(
                    //   Params.OrderID,
                    //   ": ",
                    //   "After Deduction Balance: ",
                    //   data.balance,
                    //   "\n",
                    // );
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: {
                                awbNumber: Params.AWB,
                            },
                            data: {
                                payedBy: "WALLET",
                            },
                        })];
                case 2:
                    // // console.log(
                    //   Params.OrderID,
                    //   ": ",
                    //   " Before Deduction Balance: ",
                    //   Params.UserBalance,
                    // );
                    // console.log(
                    //   Params.OrderID,
                    //   ": ",
                    //   "After Deduction Balance: ",
                    //   data.balance,
                    //   "\n",
                    // );
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.log("wallet payment failed ", error_2);
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function Order_Credits(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_1.default.credits.create({
                            data: {
                                userId: Params.userID,
                                Credit_Type: "",
                                status: "ORDER PAID",
                                debitedAmount: Params.OrderValue,
                                balance: Number(Params.UserBalance) - Params.OrderValue,
                                customerName: Params.fullname,
                                description: "Order Deduction from Credits",
                                creditedAmount: 0,
                                tags: "orders",
                                transactionDate: new Date(),
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 1:
                    data = _a.sent();
                    // console.log("Credits line 1028: ",data)
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: {
                                awbNumber: Params.AWB,
                            },
                            data: {
                                payedBy: "CREDITS",
                            },
                        })];
                case 2:
                    // console.log("Credits line 1028: ",data)
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.log("credits payment failed ", error_3);
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function Order_Card(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma_1.default.card_Limit.create({
                            data: {
                                userId: Params.userID,
                                status: "ORDER PAID",
                                debitedAmount: Params.OrderValue,
                                balance: Number(Params.UserBalance) - Params.OrderValue,
                                customerName: Params.fullname,
                                description: "Order Deduction from Card_Limit",
                                creditedAmount: 0,
                                transactionDate: new Date(),
                                orderId: Params.OrderID,
                                tags: "orders",
                                awbNumber: Params.AWB,
                            },
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: {
                                awbNumber: Params.AWB,
                            },
                            data: {
                                payedBy: "CARD",
                            },
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.log("Card payment failed ", error_4);
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function Combo_WC(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    if (!(Params.Deduction_Mode == "WALLET")) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma_1.default.wallet.create({
                            data: {
                                userId: Params.userID,
                                TransactionId: "",
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Number(Params.Balance_1),
                                creditedAmount: 0,
                                balance: 0,
                                ModeOfPayment: "ShypBUDDY WALLET",
                                description: "COMBO Deduction from Wallet and Credits",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 1:
                    _a.sent();
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    return [4 /*yield*/, prisma_1.default.credits.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Number(Params.OrderValue),
                                creditedAmount: 0,
                                balance: Number(Params.Balance_2) - Number(Params.OrderValue),
                                description: "COMBO Deduction from Wallet and Credits",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                Credit_Type: "",
                            },
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 3: return [4 /*yield*/, prisma_1.default.credits.create({
                        data: {
                            userId: Params.userID,
                            customerName: Params.fullname,
                            status: "ORDER PAID",
                            transactionDate: new Date(),
                            debitedAmount: Number(Params.Balance_1),
                            creditedAmount: 0,
                            balance: 0,
                            description: "COMBO Deduction from Credits and Wallet",
                            tags: "orders",
                            orderId: Params.OrderID,
                            awbNumber: Params.AWB,
                            Credit_Type: "",
                        },
                    })];
                case 4:
                    _a.sent();
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    return [4 /*yield*/, prisma_1.default.wallet.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Number(Params.OrderValue),
                                creditedAmount: 0,
                                balance: Number(Params.Balance_2) - Number(Params.OrderValue),
                                description: "COMBO Deduction from Credits and Wallet",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                TransactionId: "",
                                ModeOfPayment: "WALLET",
                            },
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma_1.default.orders.update({
                            where: {
                                awbNumber: Params.AWB,
                            },
                            data: {
                                payedBy: [Params.Deduction_Mode, Params.Deduction_Mode2].join("_"),
                                Combo_Amount: [Params.Balance_1, Params.OrderValue].join("_"),
                            },
                        })];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_5 = _a.sent();
                    console.log("error in Combo _WC");
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function Combo_CC(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    if (!(Params.Deduction_Mode == "CREDITS")) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma_1.default.credits.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Number(Params.Balance_1),
                                creditedAmount: 0,
                                balance: 0,
                                description: "COMBO Deduction from Credits and Card",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                Credit_Type: "",
                            },
                        })];
                case 1:
                    _a.sent();
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    return [4 /*yield*/, prisma_1.default.card_Limit.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Number(Params.OrderValue),
                                creditedAmount: 0,
                                balance: Number(Params.Balance_2) - Number(Params.OrderValue),
                                description: "COMBO Deduction from cardLimit and Credits",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 3: return [4 /*yield*/, prisma_1.default.card_Limit.create({
                        data: {
                            userId: Params.userID,
                            customerName: Params.fullname,
                            status: "ORDER PAID",
                            transactionDate: new Date(),
                            debitedAmount: Params.Balance_1,
                            creditedAmount: 0,
                            balance: 0,
                            description: "COMBO Deduction from CardLimit and Credits",
                            tags: "orders",
                            orderId: Params.OrderID,
                            awbNumber: Params.AWB,
                        },
                    })];
                case 4:
                    _a.sent();
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    return [4 /*yield*/, prisma_1.default.credits.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Number(Params.OrderValue),
                                creditedAmount: 0,
                                balance: Number(Params.Balance_2) - Number(Params.OrderValue),
                                description: "COMBO Deduction from CardLimit and Credits",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                Credit_Type: "",
                            },
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [4 /*yield*/, prisma_1.default.orders.update({
                        where: {
                            awbNumber: Params.AWB,
                        },
                        data: {
                            payedBy: [Params.Deduction_Mode, Params.Deduction_Mode2].join("_"),
                            Combo_Amount: [Params.Balance_1, Params.OrderValue].join("_"),
                        },
                    })];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 8:
                    error_6 = _a.sent();
                    console.log("error in Combo _CC", error_6);
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function Combo_WCA(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var comboMCa, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    if (!(Params.Deduction_Mode == "WALLET")) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma_1.default.wallet.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Number(Params.Balance_1),
                                creditedAmount: 0,
                                balance: 0,
                                description: "COMBO Deduction from Wallet and Card",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                TransactionId: "",
                                ModeOfPayment: "",
                            },
                        })];
                case 1:
                    _a.sent();
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    return [4 /*yield*/, prisma_1.default.card_Limit.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Number(Params.OrderValue),
                                creditedAmount: 0,
                                balance: Number(Params.Balance_2) - Number(Params.OrderValue),
                                description: "COMBO Deduction from Wallet and Card",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 3: return [4 /*yield*/, prisma_1.default.card_Limit.create({
                        data: {
                            userId: Params.userID,
                            customerName: Params.fullname,
                            status: "ORDER PAID",
                            transactionDate: new Date(),
                            debitedAmount: Params.Balance_1,
                            creditedAmount: 0,
                            balance: 0,
                            description: "COMBO Deduction from Card and Wallet",
                            tags: "orders",
                            orderId: Params.OrderID,
                            awbNumber: Params.AWB,
                        },
                    })];
                case 4:
                    _a.sent();
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    return [4 /*yield*/, prisma_1.default.wallet.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: Number(Params.OrderValue),
                                creditedAmount: 0,
                                balance: Number(Params.Balance_2) - Number(Params.OrderValue),
                                description: "COMBO Deduction from Card and Wallet",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                TransactionId: "",
                                ModeOfPayment: "",
                            },
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [4 /*yield*/, prisma_1.default.orders.update({
                        where: {
                            awbNumber: Params.AWB,
                        },
                        data: {
                            payedBy: [Params.Deduction_Mode, Params.Deduction_Mode2].join("_"),
                            Combo_Amount: [Params.Balance_1, Params.OrderValue].join("_"),
                        },
                    })];
                case 7:
                    comboMCa = _a.sent();
                    return [3 /*break*/, 9];
                case 8:
                    error_7 = _a.sent();
                    console.log("error in Combo WCA", error_7);
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function walletDeduction(params, balance, debitedAmount, creditAmount) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.default.wallet.create({
                        data: {
                            userId: params.userID,
                            customerName: params.fullname,
                            status: "ORDER PAID",
                            transactionDate: new Date(),
                            debitedAmount: debitedAmount,
                            creditedAmount: creditAmount,
                            balance: balance,
                            description: "COMBO Deduction from Wallet, Credits and Card",
                            tags: "orders",
                            orderId: params.OrderID,
                            awbNumber: params.AWB,
                            TransactionId: "",
                            ModeOfPayment: "",
                        },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function creditsDeduction(params, balance, debitedAmount, creditAmount) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.default.credits.create({
                        data: {
                            userId: params.userID,
                            customerName: params.fullname,
                            status: "ORDER PAID",
                            transactionDate: new Date(),
                            debitedAmount: debitedAmount,
                            creditedAmount: creditAmount,
                            balance: balance,
                            description: "COMBO Deduction from Wallet, credits and Card",
                            tags: "orders",
                            orderId: params.OrderID,
                            awbNumber: params.AWB,
                            Credit_Type: "",
                        },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function orderUpdation(params, payedBy) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.default.orders.update({
                        where: {
                            awbNumber: params.AWB,
                        },
                        data: {
                            payedBy: payedBy,
                            Combo_Amount: "".concat(params.Balance_1, "_").concat(params.Balance_2, "_").concat(params.OrderValue),
                        },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function cardsDeduction(params, balance, debitedAmount, creditAmount) {
    return __awaiter(this, void 0, void 0, function () {
        var error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_1.default.card_Limit.create({
                            data: {
                                userId: params.userID,
                                customerName: params.fullname,
                                status: "ORDER PAID",
                                transactionDate: new Date(),
                                debitedAmount: debitedAmount,
                                creditedAmount: creditAmount,
                                balance: balance,
                                description: "COMBO Deduction from Wallet, credits and Card",
                                tags: "orders",
                                orderId: params.OrderID,
                                awbNumber: params.AWB,
                            },
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _a.sent();
                    // console.log("error in Combo WCA", error);
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function Combo_WCCA(Params) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // console.log("WCCA");
                if (Params.Deduction_Mode == "CARD" && Params.Deduction_Mode2 == "CREDIT") {
                    // console.log("line 1006");
                    cardsDeduction(Params, parseInt(Params.Amount_1), parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    creditsDeduction(Params, parseInt(Params.Amount_2), parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    walletDeduction(Params, parseInt(Params.Balance_3) - Params.OrderValue, Params.OrderValue, parseInt(Params.Amount_3));
                    orderUpdation(Params, "CARD_CREDIT_WALLET");
                }
                else if (Params.Deduction_Mode == "CARD" &&
                    Params.Deduction_Mode2 == "WALLET") {
                    // console.log("line 1022");
                    cardsDeduction(Params, parseInt(Params.Amount_1), parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    walletDeduction(Params, parseInt(Params.Amount_2), parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    creditsDeduction(Params, parseInt(Params.Balance_3) - Params.OrderValue, Params.OrderValue, parseInt(Params.Amount_3));
                    orderUpdation(Params, "CARD_WALLET_CREDIT");
                }
                else if (Params.Deduction_Mode == "CREDIT" &&
                    Params.Deduction_Mode2 == "CARD") {
                    // console.log("line 1038");
                    creditsDeduction(Params, parseInt(Params.Amount_1), parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    cardsDeduction(Params, parseInt(Params.Amount_2), parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    walletDeduction(Params, parseInt(Params.Balance_3) - Params.OrderValue, Params.OrderValue, parseInt(Params.Amount_3));
                    orderUpdation(Params, "CREDIT_CARD_WALLET");
                }
                else if (Params.Deduction_Mode == "WALLET" &&
                    Params.Deduction_Mode2 == "CARD") {
                    // console.log("line 1053");
                    walletDeduction(Params, parseInt(Params.Amount_1), parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    cardsDeduction(Params, parseInt(Params.Amount_2), parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    creditsDeduction(Params, parseInt(Params.Balance_3) - Params.OrderValue, Params.OrderValue, parseInt(Params.Amount_3));
                    orderUpdation(Params, "WALLET_CARD_CREDIT");
                }
                else if (Params.Deduction_Mode == "WALLET" &&
                    Params.Deduction_Mode2 == "CREDIT") {
                    // console.log("line 1068");
                    walletDeduction(Params, parseInt(Params.Amount_1), parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    creditsDeduction(Params, parseInt(Params.Amount_2), parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    cardsDeduction(Params, parseInt(Params.Balance_3) - Params.OrderValue, Params.OrderValue, parseInt(Params.Amount_3));
                    orderUpdation(Params, "WALLET_CREDIT_CARD");
                }
                else if (Params.Deduction_Mode == "CREDIT" &&
                    Params.Deduction_Mode2 == "WALLET") {
                    // console.log("line 1083");
                    creditsDeduction(Params, parseInt(Params.Amount_1), parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    walletDeduction(Params, parseInt(Params.Amount_2), parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    // console.log("Params.OrderValue", Params)
                    cardsDeduction(Params, parseInt(Params.Balance_3) - Params.OrderValue, Params.OrderValue, parseInt(Params.Amount_3));
                    orderUpdation(Params, "CREDIT_WALLET_CARD");
                }
                else {
                    // console.log('line 881', Params.Balance_1, " ", Params.OrderValue);
                }
            }
            catch (error) {
                console.log("error in Combo WCC", error);
                return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
            }
            return [2 /*return*/];
        });
    });
}
function Refund_WCCA(Params, remaningValues) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // console.log("WCCA");
                if (Params.Deduction_Mode == "CARD" && Params.Deduction_Mode2 == "CREDIT") {
                    // console.log("line 1006");
                    cardsDeduction(Params, parseInt(Params.Amount_1) + remaningValues.cards, parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    creditsDeduction(Params, parseInt(Params.Amount_2) + remaningValues.credits, parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    walletDeduction(Params, remaningValues.wallet + parseInt(Params.Amount_3), 0, parseInt(Params.Amount_3));
                }
                else if (Params.Deduction_Mode == "CARD" &&
                    Params.Deduction_Mode2 == "WALLET") {
                    // console.log("line 1022");
                    cardsDeduction(Params, parseInt(Params.Amount_1) + remaningValues.cards, parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    walletDeduction(Params, parseInt(Params.Amount_2) + remaningValues.wallet, parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    creditsDeduction(Params, remaningValues.credits + parseInt(Params.Amount_3), 0, parseInt(Params.Amount_3));
                }
                else if (Params.Deduction_Mode == "CREDIT" &&
                    Params.Deduction_Mode2 == "CARD") {
                    // console.log("line 1038");
                    creditsDeduction(Params, parseInt(Params.Amount_1) + remaningValues.credits, parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    cardsDeduction(Params, parseInt(Params.Amount_2) + remaningValues.cards, parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    walletDeduction(Params, remaningValues.wallet + parseInt(Params.Amount_3), 0, parseInt(Params.Amount_3));
                }
                else if (Params.Deduction_Mode == "WALLET" &&
                    Params.Deduction_Mode2 == "CARD") {
                    // console.log("line 1053");
                    walletDeduction(Params, parseInt(Params.Amount_1) + remaningValues.wallet, parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    cardsDeduction(Params, parseInt(Params.Amount_2) + remaningValues.cards, parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    creditsDeduction(Params, remaningValues.credits + parseInt(Params.Amount_3), 0, parseInt(Params.Amount_3));
                }
                else if (Params.Deduction_Mode == "WALLET" &&
                    Params.Deduction_Mode2 == "CREDIT") {
                    // console.log("line 1068");
                    walletDeduction(Params, parseInt(Params.Amount_1) + remaningValues.wallet, parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    creditsDeduction(Params, parseInt(Params.Amount_2) + remaningValues.credits, parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    cardsDeduction(Params, remaningValues.cards + parseInt(Params.Amount_3), 0, parseInt(Params.Amount_3));
                }
                else if (Params.Deduction_Mode == "CREDIT" &&
                    Params.Deduction_Mode2 == "WALLET") {
                    // console.log("line 1083");
                    creditsDeduction(Params, parseInt(Params.Amount_1) + remaningValues.credits, parseInt(Params.Balance_1), parseInt(Params.Amount_1));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                    walletDeduction(Params, parseInt(Params.Amount_2) + remaningValues.wallet, parseInt(Params.Balance_2), parseInt(Params.Amount_2));
                    Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
                    // console.log("Params.OrderValue", Params)
                    cardsDeduction(Params, remaningValues.cards + parseInt(Params.Amount_3), 0, parseInt(Params.Amount_3));
                }
                else {
                    // console.log('line 881', Params.Balance_1, " ", Params.OrderValue);
                }
            }
            catch (error) {
                console.log("error in  Refund_WCCA", error);
                return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
            }
            return [2 /*return*/];
        });
    });
}
function Refund_Wallet(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_1.default.wallet.create({
                            data: {
                                userId: Params.userID,
                                transactionDate: new Date(),
                                tags: "orders",
                                status: "ORDER REFUND",
                                creditedAmount: Number(Params.OrderValue),
                                debitedAmount: 0,
                                balance: Number(Params.UserBalance) + Number(Params.OrderValue),
                                ModeOfPayment: "ShypBUDDY Wallet",
                                description: "Amount refunded for Order in Wallet",
                                TransactionId: "",
                                customerName: Params.fullname,
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { status: "OK" }];
                case 2:
                    error_9 = _a.sent();
                    console.log(" Order refund wallet by wallet ", error_9);
                    return [2 /*return*/, { status: "FAILED" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function Refund_Credits(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_1.default.credits.create({
                            data: {
                                userId: Params.userID,
                                transactionDate: new Date(),
                                tags: "orders",
                                status: "ORDER REFUND",
                                creditedAmount: Number(Params.OrderValue),
                                debitedAmount: 0,
                                balance: Number(Params.UserBalance) + Number(Params.OrderValue),
                                description: "Amount refunded for Order in credits",
                                customerName: Params.fullname,
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                Credit_Type: "",
                            },
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { status: "OK" }];
                case 2:
                    error_10 = _a.sent();
                    console.log(" Order refund by Credits ", error_10);
                    return [2 /*return*/, { status: "FAILED" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function Refund_Card(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_1.default.card_Limit.create({
                            data: {
                                userId: Params.userID,
                                transactionDate: new Date(),
                                tags: "orders",
                                status: "ORDER REFUND",
                                creditedAmount: Number(Params.OrderValue),
                                debitedAmount: 0,
                                balance: Number(Params.UserBalance) + Number(Params.OrderValue),
                                description: "Amount refunded for Order in card_Limit",
                                customerName: Params.fullname,
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { status: "OK" }];
                case 2:
                    error_11 = _a.sent();
                    console.log(" Order refund by card_Limit ", error_11);
                    return [2 /*return*/, { status: "FAILED" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function Refund_WC(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    if (!(Params.Deduction_Mode == "WALLET_CREDITS")) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma_1.default.wallet.create({
                            data: {
                                userId: Params.userID,
                                TransactionId: "",
                                customerName: Params.fullname,
                                status: "ORDER REFUND",
                                transactionDate: new Date(),
                                debitedAmount: 0,
                                creditedAmount: Number(Params.Amount_1),
                                balance: Number(Params.Balance_1) + Number(Params.Amount_1),
                                ModeOfPayment: "ShypBUDDY WALLET",
                                description: "COMBO Refund in Wallet and Credits",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma_1.default.credits.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER REFUND",
                                transactionDate: new Date(),
                                debitedAmount: 0,
                                creditedAmount: Number(Params.Amount_2),
                                balance: Number(Params.Balance_2) + Number(Params.Amount_2),
                                description: "COMBO Refund in Credits and Wallet",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                Credit_Type: "",
                            },
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 3: return [4 /*yield*/, prisma_1.default.wallet.create({
                        data: {
                            userId: Params.userID,
                            TransactionId: "",
                            customerName: Params.fullname,
                            status: "ORDER REFUND",
                            transactionDate: new Date(),
                            debitedAmount: 0,
                            creditedAmount: Number(Params.Amount_2),
                            balance: Number(Params.Balance_2) + Number(Params.Amount_2),
                            ModeOfPayment: "ShypBUDDY WALLET",
                            description: "COMBO Refund in Wallet and Credits",
                            tags: "orders",
                            orderId: Params.OrderID,
                            awbNumber: Params.AWB,
                        },
                    })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma_1.default.credits.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER REFUND",
                                transactionDate: new Date(),
                                debitedAmount: 0,
                                creditedAmount: Number(Params.Amount_1),
                                balance: Number(Params.Balance_1) + Number(Params.Amount_1),
                                description: "COMBO Refund in Credits and Wallet",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                Credit_Type: "",
                            },
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_12 = _a.sent();
                    console.log("error in Refund_WC");
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function Refund_CC(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var error_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    if (!(Params.Deduction_Mode == "CREDITS")) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma_1.default.credits.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER REFUND",
                                transactionDate: new Date(),
                                debitedAmount: 0,
                                creditedAmount: Number(Params.Amount_1),
                                balance: Number(Params.Balance_1) + Number(Params.Amount_1),
                                description: "COMBO Refund in Credits and Card",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                Credit_Type: "",
                            },
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma_1.default.card_Limit.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER REFUND",
                                transactionDate: new Date(),
                                debitedAmount: 0,
                                creditedAmount: Number(Params.Amount_2),
                                balance: Number(Params.Balance_2) + Number(Params.Amount_2),
                                description: "COMBO Refund in Credits and Card",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 3: return [4 /*yield*/, prisma_1.default.credits.create({
                        data: {
                            userId: Params.userID,
                            customerName: Params.fullname,
                            status: "ORDER REFUND",
                            transactionDate: new Date(),
                            debitedAmount: 0,
                            creditedAmount: Number(Params.Amount_2),
                            balance: Number(Params.Balance_2) + Number(Params.Amount_2),
                            description: "COMBO Refund in Credits and Card",
                            tags: "orders",
                            orderId: Params.OrderID,
                            awbNumber: Params.AWB,
                            Credit_Type: "",
                        },
                    })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma_1.default.card_Limit.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER REFUND",
                                transactionDate: new Date(),
                                debitedAmount: 0,
                                creditedAmount: Number(Params.Amount_1),
                                balance: Number(Params.Balance_1) + Number(Params.Amount_1),
                                description: "COMBO Refund in Credits and Card",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_13 = _a.sent();
                    // console.log("error in Refund_WC");
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function Refund_WCA(Params) {
    return __awaiter(this, void 0, void 0, function () {
        var error_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    if (!(Params.Deduction_Mode == "WALLET")) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma_1.default.wallet.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER REFUND",
                                transactionDate: new Date(),
                                debitedAmount: 0,
                                creditedAmount: Number(Params.Amount_1),
                                balance: Number(Params.Balance_1) + Number(Params.Amount_1),
                                description: "COMBO Refund in Wallet and Card",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                                ModeOfPayment: "",
                                TransactionId: "",
                            },
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma_1.default.card_Limit.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER REFUND",
                                transactionDate: new Date(),
                                debitedAmount: 0,
                                creditedAmount: Number(Params.Amount_2),
                                balance: Number(Params.Balance_2) + Number(Params.Amount_2),
                                description: "COMBO Refund in Wallet and Card",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 3: return [4 /*yield*/, prisma_1.default.wallet.create({
                        data: {
                            userId: Params.userID,
                            customerName: Params.fullname,
                            status: "ORDER REFUND",
                            transactionDate: new Date(),
                            debitedAmount: 0,
                            creditedAmount: Number(Params.Amount_2),
                            balance: Number(Params.Balance_2) + Number(Params.Amount_2),
                            description: "COMBO Refund in Wallet and Card",
                            tags: "orders",
                            orderId: Params.OrderID,
                            awbNumber: Params.AWB,
                            ModeOfPayment: "",
                            TransactionId: "",
                        },
                    })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma_1.default.card_Limit.create({
                            data: {
                                userId: Params.userID,
                                customerName: Params.fullname,
                                status: "ORDER REFUND",
                                transactionDate: new Date(),
                                debitedAmount: 0,
                                creditedAmount: Number(Params.Amount_1),
                                balance: Number(Params.Balance_1) + Number(Params.Amount_1),
                                description: "COMBO Refund in Wallet and Card",
                                tags: "orders",
                                orderId: Params.OrderID,
                                awbNumber: Params.AWB,
                            },
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_14 = _a.sent();
                    console.log("error in Refund_WCA", error_14);
                    return [2 /*return*/, { status: "FAILED", message: "PAYMENT FAILED" }];
                case 8: return [2 /*return*/];
            }
        });
    });
}
