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
const prisma_1 = __importDefault(require("../lib/prisma"));
function getuserBalance(user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!user) {
            return { status: 500, data: 0 };
        }
        try {
            let InitialBal = yield prisma_1.default.wallet.findFirst({
                where: {
                    userId: user.userID,
                },
                orderBy: {
                    transactionDate: "desc",
                },
            });
            console.log("User id in balance: ", InitialBal === null || InitialBal === void 0 ? void 0 : InitialBal.balance);
            if (InitialBal === null) {
                return { status: 200, data: 0 };
            }
            else {
                return { status: 200, data: InitialBal.balance };
            }
        }
        catch (error) {
            return { status: 500, data: 0 };
        }
    });
}
function OrderBalanceApi(orderValue, id, userId, BulkUser) {
    return __awaiter(this, void 0, void 0, function* () {
        // let user: any
        // const responseId = await getUserById2(userId);
        // console.log(" Bulk User line 51 ",BulkUser);
        //  user = !BulkUser?await getCurrentUser():BulkUser;
        // console.log(user," Bulk User ",BulkUser);
        const balance = yield getuserBalance(userId);
        console.log(balance.data, "line 193 ", orderValue);
        let walletBalance = 0;
        let CreditBalance = 0;
        let CardBalance = 0;
        let ModeofPayment = "";
        let Combo_Balance = "";
        // console.log();
        if (!balance || Number(balance.data) < orderValue) {
            // console.log("wallet not sufficient line 1638");
            walletBalance = !balance ? 0 : Number(balance.data);
            const credits = yield prisma_1.default.credits.findFirst({
                where: {
                    userId: userId,
                },
                orderBy: {
                    transactionDate: "desc",
                },
                select: {
                    balance: true,
                },
            });
            if (!credits || Number(credits.balance) < orderValue) {
                CreditBalance = !credits ? 0 : Number(credits.balance);
                // console.log("Credits not sufficient line 1638");
                const cardLimit = yield prisma_1.default.card_Limit.findFirst({
                    where: {
                        userId: userId,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                if (!cardLimit || Number(cardLimit.balance) < orderValue) {
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
                        return {
                            status: "OK",
                            message: "Balance Sufficient",
                            Mode: ModeofPayment,
                            balance: Combo_Balance,
                        };
                    }
                    else {
                        if (CreditBalance + CardBalance >= orderValue) {
                            ModeofPayment =
                                CreditBalance <= CardBalance ? "CREDITS_CARD" : "CARD_CREDITS";
                            Combo_Balance =
                                CreditBalance <= CardBalance
                                    ? [CreditBalance.toString(), CardBalance.toString()].join("_")
                                    : [CardBalance.toString(), CreditBalance.toString()].join("_");
                            return {
                                status: "OK",
                                message: "Balance Sufficient",
                                Mode: ModeofPayment,
                                balance: Combo_Balance,
                            };
                        }
                        else {
                            if (walletBalance + CardBalance >= orderValue) {
                                ModeofPayment =
                                    walletBalance <= CardBalance ? "WALLET_CARD" : "CARD_WALLET";
                                Combo_Balance =
                                    walletBalance <= CardBalance
                                        ? [walletBalance.toString(), CardBalance.toString()].join("_")
                                        : [CardBalance.toString(), walletBalance.toString()].join("_");
                                return {
                                    status: "OK",
                                    message: "Balance Sufficient",
                                    Mode: ModeofPayment,
                                    balance: Combo_Balance,
                                };
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
                                return {
                                    status: "OK",
                                    message: "Balance Sufficient",
                                    Mode: ModeofPayment,
                                    balance: Combo_Balance,
                                };
                            }
                            else {
                                return {
                                    status: "FAILED",
                                    message: "Insufficient Balance in cardLimit",
                                    Mode: "",
                                    balance: "none",
                                };
                            }
                        }
                    }
                }
                else {
                    // console.log("CardLimit sufficient line 1638");
                    yield prisma_1.default.orders.update({
                        where: {
                            id: id,
                        },
                        data: {
                            payedBy: "CARD",
                        },
                    });
                    // console.log("Card sufficient line 1638");
                    return {
                        status: "OK",
                        message: "Balance Sufficient",
                        Mode: "CARD",
                        balance: cardLimit.balance.toString(),
                    };
                }
            }
            else {
                // console.log("Credits sufficient line 1638");
                return {
                    status: "OK",
                    message: "Balance Sufficient",
                    Mode: "CREDITS",
                    balance: credits.balance.toString(),
                };
            }
        }
        else {
            // console.log("Wallet sufficient line 1638");
            return {
                status: "OK",
                message: "Balance Sufficient",
                Mode: "WALLET",
                balance: balance.data.toString(),
            };
        }
    });
}
function OrderDeductionApi(orderValue, orderId, awbNumber, Mode, Userbalance, userId, BulkUser) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("entered 526 ", orderValue, orderId, awbNumber, Mode, Userbalance);
        // let user: any;
        // user = !BulkUser?await getCurrentUser():BulkUser;
        // const responseId = await getCurrentUser();
        // if (!responseId) {
        //   return { status: "FAILED", message: "User not found" };
        // }
        let userData = yield prisma_1.default.users.findUnique({
            where: {
                userid: userId
            }, select: {
                fullname: true,
            }
        });
        if (!userData) {
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
        // console.log("user: ", BulkUser," ",user);
        let first_from = [];
        let first_balance = [];
        if (Mode.includes("_")) {
            first_from = Mode.split("_");
            first_balance = Userbalance.split("_");
        }
        let Deduction_Object = {
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
        // // console.log(Mode," this is the object: ", Deduction_Object);
        switch (Mode) {
            case "WALLET":
                // console.log("Wallet Case");
                yield Order_Wallet(Deduction_Object);
                break;
            case "CREDITS":
                // console.log("Credits Case");
                yield Order_Credits(Deduction_Object);
                break;
            case "CARD":
                yield Order_Card(Deduction_Object);
                // console.log("Card Case");
                break;
            case "WALLET_CREDITS":
            case "CREDITS_WALLET":
                // console.log("Combo Case");
                yield Combo_WC(Deduction_Object);
                break;
            case "CREDITS_CARD":
            case "CARD_CREDITS":
                // console.log("Combo Case credits");
                yield Combo_CC(Deduction_Object);
                break;
            case "WALLET_CARD":
            case "CARD_WALLET":
                // console.log("COmbo case deduction WCA");
                yield Combo_WCA(Deduction_Object);
                break;
            case "CARD_CREDIT_WALLET":
            case "CARD_WALLET_CREDIT":
            case "CREDIT_CARD_WALLET":
            case "WALLET_CARD_CREDIT":
            case "WALLET_CREDIT_CARD":
            case "CREDIT_WALLET_CARD":
                // console.log("COmbo case deduction WCCA");
                yield Combo_WCCA(Deduction_Object);
                break;
        }
        return { status: "OK" };
    });
}
function OrderRefundAPI(orderRate, orderID, awb, Payed_By, Combo_Amount, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const userDetails = yield prisma_1.default.users.findUnique({
            where: {
                userid: userId
            }, select: {
                fullname: true,
                userid: true,
            }
        });
        if (!userDetails) {
            return { status: "Not OK" };
        }
        let balance;
        let creditBalance;
        let cardBalance;
        let RefundAmount;
        let Deduction_Mode = [];
        let first_from = [];
        console.log("i am last here", Combo_Amount, " ", Payed_By);
        if (Combo_Amount && Combo_Amount.includes("_")) {
            // console.log("i am last here line 293");
            first_from = Combo_Amount.split("_");
        }
        if (Payed_By.includes("_")) {
            Deduction_Mode = Payed_By.split("_");
        }
        // console.log("i am last here line 302");
        let Refund_Object = {
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
        // console.log("im workingssssss", JSON.stringify(Refund_Object));
        switch (Payed_By) {
            case "WALLET":
                // console.log("Wallet Refund");
                balance = yield prisma_1.default.wallet.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                Refund_Object.UserBalance = !balance ? "" : balance.balance.toString();
                yield Refund_Wallet(Refund_Object);
                break;
            case "CREDITS":
                // console.log("CREDITS Refund");
                balance = yield prisma_1.default.credits.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                Refund_Object.UserBalance = !balance ? "" : balance.balance.toString();
                yield Refund_Credits(Refund_Object);
                break;
            case "CARD":
                // console.log("CARD Refund");
                balance = yield prisma_1.default.card_Limit.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                Refund_Object.UserBalance = !balance ? "" : balance.balance.toString();
                yield Refund_Card(Refund_Object);
                break;
            case "WALLET_CREDITS":
            case "CREDITS_WALLET":
                // console.log("Combo Case WC");
                creditBalance = yield prisma_1.default.credits.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                balance = yield prisma_1.default.wallet.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
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
                yield Refund_WC(Refund_Object);
                break;
            case "CREDITS_CARD":
            case "CARD_CREDITS":
                // console.log("Combo Case CC");
                cardBalance = yield prisma_1.default.card_Limit.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                creditBalance = yield prisma_1.default.credits.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
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
                yield Refund_CC(Refund_Object);
                break;
            case "WALLET_CARD":
            case "CARD_WALLET":
                // console.log("Combo Case WCA");
                cardBalance = yield prisma_1.default.card_Limit.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                balance = yield prisma_1.default.wallet.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
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
                yield Refund_WCA(Refund_Object);
                break;
            case "CARD_CREDIT_WALLET":
            case "CARD_WALLET_CREDIT":
            case "CREDIT_CARD_WALLET":
            case "WALLET_CARD_CREDIT":
            case "WALLET_CREDIT_CARD":
            case "CREDIT_WALLET_CARD":
                // console.log("COmbo case refund WCCA", Refund_Object);
                const cards = yield prisma_1.default.card_Limit.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                const credits = yield prisma_1.default.credits.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                const wallet = yield prisma_1.default.wallet.findFirst({
                    where: {
                        userId: userDetails === null || userDetails === void 0 ? void 0 : userDetails.userid,
                    },
                    orderBy: {
                        transactionDate: "desc",
                    },
                    select: {
                        balance: true,
                    },
                });
                const remaningValues = {
                    wallet: Number(wallet === null || wallet === void 0 ? void 0 : wallet.balance),
                    credits: Number(credits === null || credits === void 0 ? void 0 : credits.balance),
                    cards: Number(cards === null || cards === void 0 ? void 0 : cards.balance),
                };
                yield Refund_WCCA(Refund_Object, remaningValues);
                break;
        }
        return { status: "OK" };
    });
}
function Order_Wallet(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // console.log("welcome to wallet: ", new Date());
            const data = yield prisma_1.default.wallet.create({
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
            });
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
            yield prisma_1.default.orders.update({
                where: {
                    awbNumber: Params.AWB,
                },
                data: {
                    payedBy: "WALLET",
                },
            });
        }
        catch (error) {
            console.log("wallet payment failed ", error);
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Order_Credits(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // console.log("Credits Params: ",JSON.stringify(Params))
            const data = yield prisma_1.default.credits.create({
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
            });
            // console.log("Credits line 1028: ",data)
            yield prisma_1.default.orders.update({
                where: {
                    awbNumber: Params.AWB,
                },
                data: {
                    payedBy: "CREDITS",
                },
            });
        }
        catch (error) {
            console.log("credits payment failed ", error);
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Order_Card(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma_1.default.card_Limit.create({
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
            });
            yield prisma_1.default.orders.update({
                where: {
                    awbNumber: Params.AWB,
                },
                data: {
                    payedBy: "CARD",
                },
            });
        }
        catch (error) {
            console.log("Card payment failed ", error);
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Combo_WC(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(" I am COMBO of Wallet and credits");
        try {
            if (Params.Deduction_Mode == "WALLET") {
                yield prisma_1.default.wallet.create({
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
                });
                Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                yield prisma_1.default.credits.create({
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
                });
            }
            else {
                yield prisma_1.default.credits.create({
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
                });
                Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                yield prisma_1.default.wallet.create({
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
                });
                yield prisma_1.default.orders.update({
                    where: {
                        awbNumber: Params.AWB,
                    },
                    data: {
                        payedBy: [Params.Deduction_Mode, Params.Deduction_Mode2].join("_"),
                        Combo_Amount: [Params.Balance_1, Params.OrderValue].join("_"),
                    },
                });
            }
        }
        catch (error) {
            console.log("error in Combo _WC");
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Combo_CC(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (Params.Deduction_Mode == "CREDITS") {
                yield prisma_1.default.credits.create({
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
                });
                Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                yield prisma_1.default.card_Limit.create({
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
                });
            }
            else {
                yield prisma_1.default.card_Limit.create({
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
                });
                Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                yield prisma_1.default.credits.create({
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
                });
            }
            yield prisma_1.default.orders.update({
                where: {
                    awbNumber: Params.AWB,
                },
                data: {
                    payedBy: [Params.Deduction_Mode, Params.Deduction_Mode2].join("_"),
                    Combo_Amount: [Params.Balance_1, Params.OrderValue].join("_"),
                },
            });
        }
        catch (error) {
            console.log("error in Combo _CC", error);
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Combo_WCA(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (Params.Deduction_Mode == "WALLET") {
                yield prisma_1.default.wallet.create({
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
                });
                Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                yield prisma_1.default.card_Limit.create({
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
                });
            }
            else {
                yield prisma_1.default.card_Limit.create({
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
                });
                Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);
                yield prisma_1.default.wallet.create({
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
                });
            }
            let comboMCa = yield prisma_1.default.orders.update({
                where: {
                    awbNumber: Params.AWB,
                },
                data: {
                    payedBy: [Params.Deduction_Mode, Params.Deduction_Mode2].join("_"),
                    Combo_Amount: [Params.Balance_1, Params.OrderValue].join("_"),
                },
            });
            // console.log(comboMCa.Combo_Amount, 'line 881', Params.Balance_1, " ", Params.OrderValue);
        }
        catch (error) {
            console.log("error in Combo WCA", error);
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function walletDeduction(params, balance, debitedAmount, creditAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.default.wallet.create({
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
        });
    });
}
function creditsDeduction(params, balance, debitedAmount, creditAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.default.credits.create({
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
        });
    });
}
function orderUpdation(params, payedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.default.orders.update({
            where: {
                awbNumber: params.AWB,
            },
            data: {
                payedBy: payedBy,
                Combo_Amount: `${params.Balance_1}_${params.Balance_2}_${params.OrderValue}`,
            },
        });
    });
}
function cardsDeduction(params, balance, debitedAmount, creditAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma_1.default.card_Limit.create({
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
            });
        }
        catch (error) {
            // console.log("error in Combo WCA", error);
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Combo_WCCA(Params) {
    return __awaiter(this, void 0, void 0, function* () {
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
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Refund_WCCA(Params, remaningValues) {
    return __awaiter(this, void 0, void 0, function* () {
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
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Refund_Wallet(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("Refund Wallet");
        try {
            yield prisma_1.default.wallet.create({
                data: {
                    userId: Params.userID,
                    transactionDate: new Date(),
                    tags: "orders",
                    status: "ORDER REFUND",
                    creditedAmount: Number(Params.OrderValue),
                    debitedAmount: 0,
                    balance: Number(Params.UserBalance) + Number(Params.OrderValue),
                    ModeOfPayment: "ShypBUDDY Wallet",
                    description: `Amount refunded for Order in Wallet`,
                    TransactionId: "",
                    customerName: Params.fullname,
                    orderId: Params.OrderID,
                    awbNumber: Params.AWB,
                },
            });
            return { status: "OK" };
        }
        catch (error) {
            console.log(" Order refund wallet by wallet ", error);
            return { status: "FAILED" };
        }
    });
}
function Refund_Credits(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("Refund Credits");
        try {
            yield prisma_1.default.credits.create({
                data: {
                    userId: Params.userID,
                    transactionDate: new Date(),
                    tags: "orders",
                    status: "ORDER REFUND",
                    creditedAmount: Number(Params.OrderValue),
                    debitedAmount: 0,
                    balance: Number(Params.UserBalance) + Number(Params.OrderValue),
                    description: `Amount refunded for Order in credits`,
                    customerName: Params.fullname,
                    orderId: Params.OrderID,
                    awbNumber: Params.AWB,
                    Credit_Type: "",
                },
            });
            return { status: "OK" };
        }
        catch (error) {
            console.log(" Order refund by Credits ", error);
            return { status: "FAILED" };
        }
    });
}
function Refund_Card(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("Refund Card");
        try {
            yield prisma_1.default.card_Limit.create({
                data: {
                    userId: Params.userID,
                    transactionDate: new Date(),
                    tags: "orders",
                    status: "ORDER REFUND",
                    creditedAmount: Number(Params.OrderValue),
                    debitedAmount: 0,
                    balance: Number(Params.UserBalance) + Number(Params.OrderValue),
                    description: `Amount refunded for Order in card_Limit`,
                    customerName: Params.fullname,
                    orderId: Params.OrderID,
                    awbNumber: Params.AWB,
                },
            });
            return { status: "OK" };
        }
        catch (error) {
            console.log(" Order refund by card_Limit ", error);
            return { status: "FAILED" };
        }
    });
}
function Refund_WC(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(" I am COMBO of Wallet and credits");
        try {
            if (Params.Deduction_Mode == "WALLET_CREDITS") {
                yield prisma_1.default.wallet.create({
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
                });
                yield prisma_1.default.credits.create({
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
                });
            }
            else {
                yield prisma_1.default.wallet.create({
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
                });
                yield prisma_1.default.credits.create({
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
                });
            }
        }
        catch (error) {
            console.log("error in Refund_WC");
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Refund_CC(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(" I am COMBO of Wallet and credits");
        try {
            if (Params.Deduction_Mode == "CREDITS") {
                yield prisma_1.default.credits.create({
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
                });
                yield prisma_1.default.card_Limit.create({
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
                });
            }
            else {
                yield prisma_1.default.credits.create({
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
                });
                yield prisma_1.default.card_Limit.create({
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
                });
            }
        }
        catch (error) {
            // console.log("error in Refund_WC");
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
function Refund_WCA(Params) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(" I am COMBO of Wallet and card");
        try {
            if (Params.Deduction_Mode == "WALLET") {
                yield prisma_1.default.wallet.create({
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
                });
                yield prisma_1.default.card_Limit.create({
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
                });
            }
            else {
                yield prisma_1.default.wallet.create({
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
                });
                yield prisma_1.default.card_Limit.create({
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
                });
            }
        }
        catch (error) {
            console.log("error in Refund_WCA", error);
            return { status: "FAILED", message: "PAYMENT FAILED" };
        }
    });
}
