import prisma from "../lib/prisma";
import { Wallet_Deduction } from "../types/ordersType";
import { CachedUser } from "../types/userTypes";

export async function getuserBalance(user : any) {
    if (!user) {
      return { status: 500, data: 0 };
    }
  
  
    try {
      let InitialBal = await prisma.wallet.findFirst({
        where: {
          userId: user.userID,
        },
        orderBy: {
          transactionDate: "desc",
        },
      });
  
      console.log("User id in balance: ", InitialBal?.balance);
  
      if (InitialBal === null) {
        return { status: 200, data: 0 };
      } else {
        return { status: 200, data: InitialBal.balance };
      }
    } catch (error) {
      return { status: 500, data: 0 };
    }
  }

export async function OrderBalanceApi(
  orderValue: number,
  id: number,
  userId: string,
  BulkUser?: CachedUser,
) {
  // let user: any
  // const responseId = await getUserById2(userId);

  // console.log(" Bulk User line 51 ",BulkUser);
  //  user = !BulkUser?await getCurrentUser():BulkUser;

  // console.log(user," Bulk User ",BulkUser);

  const balance = await getuserBalance(userId)
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

    const credits = await prisma.credits.findFirst({
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

      const cardLimit = await prisma.card_Limit.findFirst({
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
        } else {
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
          } else {
            if (walletBalance + CardBalance >= orderValue) {
              ModeofPayment =
                walletBalance <= CardBalance ? "WALLET_CARD" : "CARD_WALLET";
              Combo_Balance =
                walletBalance <= CardBalance
                  ? [walletBalance.toString(), CardBalance.toString()].join("_")
                  : [CardBalance.toString(), walletBalance.toString()].join(
                      "_",
                    );

              return {
                status: "OK",
                message: "Balance Sufficient",
                Mode: ModeofPayment,
                balance: Combo_Balance,
              };
            } else if (
              walletBalance + CardBalance + CreditBalance >=
              orderValue
            ) {
              if (
                walletBalance >= CreditBalance &&
                CreditBalance >= CardBalance
              ) {
                ModeofPayment = "CARD_CREDIT_WALLET";
                Combo_Balance = [
                  CardBalance.toString(),
                  CreditBalance.toString(),
                  walletBalance.toString(),
                ].join("_");
              } else if (
                CreditBalance >= CardBalance &&
                CardBalance >= walletBalance
              ) {
                ModeofPayment = "WALLET_CARD_CREDIT";
                Combo_Balance = [
                  walletBalance.toString(),
                  CardBalance.toString(),
                  CreditBalance.toString(),
                ].join("_");
              } else if (
                CardBalance >= walletBalance &&
                walletBalance >= CreditBalance
              ) {
                ModeofPayment = "CREDIT_WALLET_CARD";
                Combo_Balance = [
                  CreditBalance.toString(),
                  walletBalance.toString(),
                  CardBalance.toString(),
                ].join("_");
              } else if (
                CreditBalance >= walletBalance &&
                walletBalance >= CardBalance
              ) {
                ModeofPayment = "CARD_WALLET_CREDIT";
                Combo_Balance = [
                  CardBalance.toString(),
                  walletBalance.toString(),
                  CreditBalance.toString(),
                ].join("_");
              } else if (
                walletBalance >= CardBalance &&
                CardBalance >= CreditBalance
              ) {
                ModeofPayment = "WALLET_CREDIT_CARD";
                Combo_Balance = [
                  walletBalance.toString(),
                  CreditBalance.toString(),
                  CardBalance.toString(),
                ].join("_");
              } else if (
                CardBalance >= CreditBalance &&
                CreditBalance >= walletBalance
              ) {
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
            } else {
              return {
                status: "FAILED",
                message: "Insufficient Balance in cardLimit",
                Mode: "",
                balance: "none",
              };
            }
          }
        }
      } else {
        // console.log("CardLimit sufficient line 1638");
        await prisma.orders.update({
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
    } else {
      // console.log("Credits sufficient line 1638");
      return {
        status: "OK",
        message: "Balance Sufficient",
        Mode: "CREDITS",
        balance: credits.balance.toString(),
      };
    }
  } else {
    // console.log("Wallet sufficient line 1638");
    return {
      status: "OK",
      message: "Balance Sufficient",
      Mode: "WALLET",
      balance: balance.data.toString(),
    };
  }
}



export async function OrderDeductionApi(
  orderValue: any,
  orderId: number,
  awbNumber: string,
  Mode: string,
  Userbalance: string,
  userId: string,
  BulkUser?: any,
) {
  // console.log("entered 526 ", orderValue, orderId, awbNumber, Mode, Userbalance);
  // let user: any;

  // user = !BulkUser?await getCurrentUser():BulkUser;
  // const responseId = await getCurrentUser();
  // if (!responseId) {
  //   return { status: "FAILED", message: "User not found" };
  // }

  let userData = await prisma.users.findUnique({
    where : {
      userid: userId
    }, select: {
      fullname: true,
    }
  })

  if (!userData) {
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
  

  // console.log("user: ", BulkUser," ",user);

  let first_from: string[] = [];
  let first_balance: string[] = [];

  if (Mode.includes("_")) {
    first_from = Mode.split("_");

    first_balance = Userbalance.split("_");
  }

  let Deduction_Object = {
    userID: userId,
    fullname:  userData.fullname ,
    OrderValue: orderValue,
    UserBalance: Userbalance,
    OrderID: orderId,
    AWB: awbNumber,
    Deduction_Mode: Mode.includes("_") ?  first_from[0] : Mode,
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
      await Order_Wallet(Deduction_Object);
      break;

    case "CREDITS":
      // console.log("Credits Case");
      await Order_Credits(Deduction_Object);
      break;

    case "CARD":
      await Order_Card(Deduction_Object);
      // console.log("Card Case");
      break;

    case "WALLET_CREDITS":
    case "CREDITS_WALLET":
      // console.log("Combo Case");

      await Combo_WC(Deduction_Object);
      break;

    case "CREDITS_CARD":
    case "CARD_CREDITS":
      // console.log("Combo Case credits");

      await Combo_CC(Deduction_Object);
      break;

    case "WALLET_CARD":
    case "CARD_WALLET":
      // console.log("COmbo case deduction WCA");
      await Combo_WCA(Deduction_Object);
      break;

    case "CARD_CREDIT_WALLET":
    case "CARD_WALLET_CREDIT":
    case "CREDIT_CARD_WALLET":
    case "WALLET_CARD_CREDIT":
    case "WALLET_CREDIT_CARD":
    case "CREDIT_WALLET_CARD":
      // console.log("COmbo case deduction WCCA");
      await Combo_WCCA(Deduction_Object);
      break;
  }

  return { status: "OK" };
}



export async function OrderRefundAPI(
  orderRate: number,
  orderID: number,
  awb: string,
  Payed_By: string,
  Combo_Amount: string,
  userId: string
) {
 
  const userDetails = await prisma.users.findUnique({
    where : {
      userid: userId
    }, select : {
      fullname: true,
      userid: true,
    }
  })

  if (!userDetails) {
    return { status: "Not OK" }
  }

  let balance: any;
  let creditBalance: any;
  let cardBalance: any;
  let RefundAmount: any;
  let Deduction_Mode: string[] = [];

  let first_from: string[] = [];
 

  console.log("i am last here",Combo_Amount," ",Payed_By);

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
      balance = await prisma.wallet.findFirst({
        where: {
          userId: userDetails?.userid,
        },
        orderBy: {
          transactionDate: "desc",
        },
        select: {
          balance: true,
        },
      })
      Refund_Object.UserBalance = !balance ? "" : balance.balance.toString();
      await Refund_Wallet(Refund_Object);
      break;

    case "CREDITS":
      // console.log("CREDITS Refund");
      balance = await prisma.credits.findFirst({
        where: {
          userId: userDetails?.userid,
        },
        orderBy: {
          transactionDate: "desc",
        },
        select: {
          balance: true,
        },
      });
      Refund_Object.UserBalance = !balance ? "" : balance.balance.toString();
      await Refund_Credits(Refund_Object);
      break;

    case "CARD":
      // console.log("CARD Refund");
      balance = await prisma.card_Limit.findFirst({
        where: {
          userId: userDetails?.userid,
        },
        orderBy: {
          transactionDate: "desc",
        },
        select: {
          balance: true,
        },
      });
      Refund_Object.UserBalance = !balance ? "" : balance.balance.toString();
      await Refund_Card(Refund_Object);
      break;

    case "WALLET_CREDITS":
    case "CREDITS_WALLET":
      // console.log("Combo Case WC");

      creditBalance = await prisma.credits.findFirst({
        where: {
          userId: userDetails?.userid,
        },
        orderBy: {
          transactionDate: "desc",
        },
        select: {
          balance: true,
        },
      });

      balance = await prisma.wallet.findFirst({
        where: {
          userId: userDetails?.userid,
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
      } else {
        Refund_Object.Balance_1 = creditBalance.balance;
        Refund_Object.Balance_2 = balance.balance;
        Refund_Object.Amount_1 = RefundAmount[0];
        Refund_Object.Amount_2 = RefundAmount[1];
      }

      await Refund_WC(Refund_Object);
      break;

    case "CREDITS_CARD":
    case "CARD_CREDITS":
      // console.log("Combo Case CC");

      cardBalance = await prisma.card_Limit.findFirst({
        where: {
          userId: userDetails?.userid,
        },
        orderBy: {
          transactionDate: "desc",
        },
        select: {
          balance: true,
        },
      });

      creditBalance = await prisma.credits.findFirst({
        where: {
          userId: userDetails?.userid,
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
      } else {
        Refund_Object.Balance_1 = cardBalance.balance;
        Refund_Object.Balance_2 = creditBalance.balance;
      }
      Refund_Object.Amount_1 = RefundAmount[0];
      Refund_Object.Amount_2 = RefundAmount[1];
      await Refund_CC(Refund_Object);
      break;

    case "WALLET_CARD":
    case "CARD_WALLET":
      // console.log("Combo Case WCA");

      cardBalance = await prisma.card_Limit.findFirst({
        where: {
          userId: userDetails?.userid,
        },
        orderBy: {
          transactionDate: "desc",
        },
        select: {
          balance: true,
        },
      });

      balance = await prisma.wallet.findFirst({
        where: {
          userId: userDetails?.userid,
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
      } else {
        Refund_Object.Balance_1 = cardBalance.balance;
        Refund_Object.Balance_2 = balance.balance;
      }
      Refund_Object.Amount_1 = RefundAmount[0];
      Refund_Object.Amount_2 = RefundAmount[1];
      await Refund_WCA(Refund_Object);
      break;

    case "CARD_CREDIT_WALLET":
    case "CARD_WALLET_CREDIT":
    case "CREDIT_CARD_WALLET":
    case "WALLET_CARD_CREDIT":
    case "WALLET_CREDIT_CARD":
    case "CREDIT_WALLET_CARD":
      // console.log("COmbo case refund WCCA", Refund_Object);
      const cards = await prisma.card_Limit.findFirst({
        where: {
          userId: userDetails?.userid,
        },
        orderBy: {
          transactionDate: "desc",
        },
        select: {
          balance: true,
        },
      });

      const credits = await prisma.credits.findFirst({
        where: {
          userId: userDetails?.userid,
        },
        orderBy: {
          transactionDate: "desc",
        },
        select: {
          balance: true,
        },
      });

      const wallet = await prisma.wallet.findFirst({
        where: {
          userId: userDetails?.userid,
        },
        orderBy: {
          transactionDate: "desc",
        },
        select: {
          balance: true,
        },
      });
      const remaningValues = {
        wallet: Number(wallet?.balance),
        credits: Number(credits?.balance),
        cards: Number(cards?.balance),
      };
      await Refund_WCCA(Refund_Object, remaningValues);
      break;
  }

  return { status: "OK" };
}

export async function Order_Wallet(Params: Wallet_Deduction) {
  try {
    // console.log("welcome to wallet: ", new Date());

    const data = await prisma.wallet.create({
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

    await prisma.orders.update({
      where: {
        awbNumber: Params.AWB,
      },
      data: {
        payedBy: "WALLET",
      },
    });
  } catch (error) {
    console.log("wallet payment failed ", error);

    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}

export async function Order_Credits(Params: Wallet_Deduction) {
  try {
  
    // console.log("Credits Params: ",JSON.stringify(Params))
    const data = await prisma.credits.create({
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

    await prisma.orders.update({
      where: {
        awbNumber: Params.AWB,
      },
      data: {
        payedBy: "CREDITS",
      },
    });
  } catch (error) {
    console.log("credits payment failed ", error);

    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}

export async function Order_Card(Params: Wallet_Deduction) {
  try {
    await prisma.card_Limit.create({
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

    await prisma.orders.update({
      where: {
        awbNumber: Params.AWB,
      },
      data: {
        payedBy: "CARD",
      },
    });
  } catch (error) {
    console.log("Card payment failed ", error);

    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}

export async function Combo_WC(Params: Wallet_Deduction) {
  // console.log(" I am COMBO of Wallet and credits");

  try {
    if (Params.Deduction_Mode == "WALLET") {
      await prisma.wallet.create({
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

      await prisma.credits.create({
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
    } else {
      await prisma.credits.create({
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

      await prisma.wallet.create({
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

      await prisma.orders.update({
        where: {
          awbNumber: Params.AWB,
        },
        data: {
          payedBy: [Params.Deduction_Mode, Params.Deduction_Mode2].join("_"),
          Combo_Amount: [Params.Balance_1, Params.OrderValue].join("_"),
        },
      });
    }
  } catch (error) {
    console.log("error in Combo _WC");
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}

export async function Combo_CC(Params: Wallet_Deduction) {
  try {
    if (Params.Deduction_Mode == "CREDITS") {
      await prisma.credits.create({
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

      await prisma.card_Limit.create({
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
    } else {
      await prisma.card_Limit.create({
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

      await prisma.credits.create({
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
    await prisma.orders.update({
      where: {
        awbNumber: Params.AWB,
      },
      data: {
        payedBy: [Params.Deduction_Mode, Params.Deduction_Mode2].join("_"),
        Combo_Amount: [Params.Balance_1, Params.OrderValue].join("_"),
      },
    });
  } catch (error) {
    console.log("error in Combo _CC", error);
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}

export async function Combo_WCA(Params: Wallet_Deduction) {
  try {
    if (Params.Deduction_Mode == "WALLET") {
      await prisma.wallet.create({
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

      await prisma.card_Limit.create({
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
    } else {
      await prisma.card_Limit.create({
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

      await prisma.wallet.create({
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
    let comboMCa = await prisma.orders.update({
      where: {
        awbNumber: Params.AWB,
      },
      data: {
        payedBy: [Params.Deduction_Mode, Params.Deduction_Mode2].join("_"),
        Combo_Amount: [Params.Balance_1, Params.OrderValue].join("_"),
      },
    });
    // console.log(comboMCa.Combo_Amount, 'line 881', Params.Balance_1, " ", Params.OrderValue);
  } catch (error) {
    console.log("error in Combo WCA", error);
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}

async function walletDeduction(
  params: Wallet_Deduction,
  balance: number,
  debitedAmount: number,
  creditAmount: number,
) {
  await prisma.wallet.create({
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
}

async function creditsDeduction(
  params: Wallet_Deduction,
  balance: number,
  debitedAmount: number,
  creditAmount: number,
) {
  await prisma.credits.create({
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
}

async function orderUpdation(params: Wallet_Deduction, payedBy: string) {
  await prisma.orders.update({
    where: {
      awbNumber: params.AWB,
    },
    data: {
      payedBy: payedBy,
      Combo_Amount: `${params.Balance_1}_${params.Balance_2}_${params.OrderValue}`,
    },
  });
}

async function cardsDeduction(
  params: Wallet_Deduction,
  balance: number,
  debitedAmount: number,
  creditAmount: number,
) {
  try
  {
    await prisma.card_Limit.create({
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
  catch(error)
  {
    // console.log("error in Combo WCA", error);
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
 
}

export async function Combo_WCCA(Params: Wallet_Deduction) {
  try {
    // console.log("WCCA");

    if (Params.Deduction_Mode == "CARD" && Params.Deduction_Mode2 == "CREDIT") {
      // console.log("line 1006");
      cardsDeduction(
        Params,
        parseInt(Params.Amount_1),
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      creditsDeduction(
        Params,
        parseInt(Params.Amount_2),
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      walletDeduction(
        Params,
        parseInt(Params.Balance_3) - Params.OrderValue,
        Params.OrderValue,
        parseInt(Params.Amount_3),
      );

      orderUpdation(Params, "CARD_CREDIT_WALLET");
    } else if (
      Params.Deduction_Mode == "CARD" &&
      Params.Deduction_Mode2 == "WALLET"
    ) {
      // console.log("line 1022");
      cardsDeduction(
        Params,
        parseInt(Params.Amount_1),
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      walletDeduction(
        Params,
        parseInt(Params.Amount_2),
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      creditsDeduction(
        Params,
        parseInt(Params.Balance_3) - Params.OrderValue,
        Params.OrderValue,
        parseInt(Params.Amount_3),
      );
      orderUpdation(Params, "CARD_WALLET_CREDIT");
    } else if (
      Params.Deduction_Mode == "CREDIT" &&
      Params.Deduction_Mode2 == "CARD"
    ) {
      // console.log("line 1038");
      creditsDeduction(
        Params,
        parseInt(Params.Amount_1),
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      cardsDeduction(
        Params,
        parseInt(Params.Amount_2),
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      walletDeduction(
        Params,
        parseInt(Params.Balance_3) - Params.OrderValue,
        Params.OrderValue,
        parseInt(Params.Amount_3),
      );
      orderUpdation(Params, "CREDIT_CARD_WALLET");
    } else if (
      Params.Deduction_Mode == "WALLET" &&
      Params.Deduction_Mode2 == "CARD"
    ) {
      // console.log("line 1053");
      walletDeduction(
        Params,
        parseInt(Params.Amount_1),
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      cardsDeduction(
        Params,
        parseInt(Params.Amount_2),
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      creditsDeduction(
        Params,
        parseInt(Params.Balance_3) - Params.OrderValue,
        Params.OrderValue,
        parseInt(Params.Amount_3),
      );
      orderUpdation(Params, "WALLET_CARD_CREDIT");
    } else if (
      Params.Deduction_Mode == "WALLET" &&
      Params.Deduction_Mode2 == "CREDIT"
    ) {
      // console.log("line 1068");
      walletDeduction(
        Params,
        parseInt(Params.Amount_1),
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      creditsDeduction(
        Params,
        parseInt(Params.Amount_2),
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      cardsDeduction(
        Params,
        parseInt(Params.Balance_3) - Params.OrderValue,
        Params.OrderValue,
        parseInt(Params.Amount_3),
      );
      orderUpdation(Params, "WALLET_CREDIT_CARD");
    } else if (
      Params.Deduction_Mode == "CREDIT" &&
      Params.Deduction_Mode2 == "WALLET"
    ) {
      // console.log("line 1083");
      creditsDeduction(
        Params,
        parseInt(Params.Amount_1),
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      walletDeduction(
        Params,
        parseInt(Params.Amount_2),
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
      // console.log("Params.OrderValue", Params)
      cardsDeduction(
        Params,
        parseInt(Params.Balance_3) - Params.OrderValue,
        Params.OrderValue,
        parseInt(Params.Amount_3),
      );

      orderUpdation(Params, "CREDIT_WALLET_CARD");
    } else {
      // console.log('line 881', Params.Balance_1, " ", Params.OrderValue);
    }
  } catch (error) {
    console.log("error in Combo WCC", error);
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}
export async function Refund_WCCA(
  Params: Wallet_Deduction,
  remaningValues: { wallet: number; credits: number; cards: number },
) {
  try {
    // console.log("WCCA");

    if (Params.Deduction_Mode == "CARD" && Params.Deduction_Mode2 == "CREDIT") {
      // console.log("line 1006");
      cardsDeduction(
        Params,
        parseInt(Params.Amount_1) + remaningValues.cards,
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      creditsDeduction(
        Params,
        parseInt(Params.Amount_2) + remaningValues.credits,
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      walletDeduction(
        Params,
        remaningValues.wallet + parseInt(Params.Amount_3),
        0,
        parseInt(Params.Amount_3),
      );
    } else if (
      Params.Deduction_Mode == "CARD" &&
      Params.Deduction_Mode2 == "WALLET"
    ) {
      // console.log("line 1022");
      cardsDeduction(
        Params,
        parseInt(Params.Amount_1) + remaningValues.cards,
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      walletDeduction(
        Params,
        parseInt(Params.Amount_2) + remaningValues.wallet,
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      creditsDeduction(
        Params,
        remaningValues.credits + parseInt(Params.Amount_3),
        0,
        parseInt(Params.Amount_3),
      );
    } else if (
      Params.Deduction_Mode == "CREDIT" &&
      Params.Deduction_Mode2 == "CARD"
    ) {
      // console.log("line 1038");
      creditsDeduction(
        Params,
        parseInt(Params.Amount_1) + remaningValues.credits,
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      cardsDeduction(
        Params,
        parseInt(Params.Amount_2) + remaningValues.cards,
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      walletDeduction(
        Params,
        remaningValues.wallet + parseInt(Params.Amount_3),
        0,
        parseInt(Params.Amount_3),
      );
    } else if (
      Params.Deduction_Mode == "WALLET" &&
      Params.Deduction_Mode2 == "CARD"
    ) {
      // console.log("line 1053");
      walletDeduction(
        Params,
        parseInt(Params.Amount_1) + remaningValues.wallet,
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      cardsDeduction(
        Params,
        parseInt(Params.Amount_2) + remaningValues.cards,
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      creditsDeduction(
        Params,
        remaningValues.credits + parseInt(Params.Amount_3),
        0,
        parseInt(Params.Amount_3),
      );
    } else if (
      Params.Deduction_Mode == "WALLET" &&
      Params.Deduction_Mode2 == "CREDIT"
    ) {
      // console.log("line 1068");
      walletDeduction(
        Params,
        parseInt(Params.Amount_1) + remaningValues.wallet,
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      creditsDeduction(
        Params,
        parseInt(Params.Amount_2) + remaningValues.credits,
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);

      cardsDeduction(
        Params,
        remaningValues.cards + parseInt(Params.Amount_3),
        0,
        parseInt(Params.Amount_3),
      );
    } else if (
      Params.Deduction_Mode == "CREDIT" &&
      Params.Deduction_Mode2 == "WALLET"
    ) {
      // console.log("line 1083");
      creditsDeduction(
        Params,
        parseInt(Params.Amount_1) + remaningValues.credits,
        parseInt(Params.Balance_1),
        parseInt(Params.Amount_1),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_1);

      walletDeduction(
        Params,
        parseInt(Params.Amount_2) + remaningValues.wallet,
        parseInt(Params.Balance_2),
        parseInt(Params.Amount_2),
      );

      Params.OrderValue = Params.OrderValue - Number(Params.Balance_2);
      // console.log("Params.OrderValue", Params)
      cardsDeduction(
        Params,
        remaningValues.cards + parseInt(Params.Amount_3),
        0,
        parseInt(Params.Amount_3),
      );
    } else {
      // console.log('line 881', Params.Balance_1, " ", Params.OrderValue);
    }
  } catch (error) {
    console.log("error in  Refund_WCCA", error);
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}

export async function Refund_Wallet(Params: Wallet_Deduction) {
  // console.log("Refund Wallet");

  try {
    await prisma.wallet.create({
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
  } catch (error) {
    console.log(" Order refund wallet by wallet ", error);

    return { status: "FAILED" };
  }
}

export async function Refund_Credits(Params: Wallet_Deduction) {
  // console.log("Refund Credits");

  try {
    await prisma.credits.create({
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
  } catch (error) {
    console.log(" Order refund by Credits ", error);

    return { status: "FAILED" };
  }
}

export async function Refund_Card(Params: Wallet_Deduction) {
  // console.log("Refund Card");

  try {
    await prisma.card_Limit.create({
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
  } catch (error) {
    console.log(" Order refund by card_Limit ", error);

    return { status: "FAILED" };
  }
}

export async function Refund_WC(Params: Wallet_Deduction) {
  // console.log(" I am COMBO of Wallet and credits");

  try {
    if (Params.Deduction_Mode == "WALLET_CREDITS") {
      await prisma.wallet.create({
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

      await prisma.credits.create({
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
    } else {
      await prisma.wallet.create({
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

      await prisma.credits.create({
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
  } catch (error) {
    console.log("error in Refund_WC");
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}

export async function Refund_CC(Params: Wallet_Deduction) {
  // console.log(" I am COMBO of Wallet and credits");

  try {
    if (Params.Deduction_Mode == "CREDITS") {
      await prisma.credits.create({
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

      await prisma.card_Limit.create({
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
    } else {
      await prisma.credits.create({
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

      await prisma.card_Limit.create({
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
  } catch (error) {
    // console.log("error in Refund_WC");
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}

export async function Refund_WCA(Params: Wallet_Deduction) {
  // console.log(" I am COMBO of Wallet and card");

  try {
    if (Params.Deduction_Mode == "WALLET") {
      await prisma.wallet.create({
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

      await prisma.card_Limit.create({
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
    } else {
      await prisma.wallet.create({
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

      await prisma.card_Limit.create({
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
  } catch (error) {
    console.log("error in Refund_WCA", error);
    return { status: "FAILED", message: "PAYMENT FAILED" };
  }
}



