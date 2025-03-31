import { PaymentMethod } from "@prisma/client";
import prisma from "../lib/prisma";
import { CachedUser } from "../types/userTypes";
import { Decimal } from "@prisma/client/runtime/library";


export async function fetchUserData(userId: string): Promise<CachedUser> {
    // const startTime = Date.now();
  
    try {
      const userRole = await prisma.users.findUnique({
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
        paymentMethod: userRole.paymentMethod as PaymentMethod,
        cardLimit: userRole.cardLimit?.toNumber(),
        specialRatesEnabled: userRole.specialRatesEnabled,
        PaymentSheet: userRole.PaymentSheet,
        partnerPreferences: userRole.partnerPreferences,
        earlyCod: userRole.earlyCod?.toNumber(),
        storeName: userRole.StoreName,
        userPreferences: userRole.partnerPreferences,
      };
  
      // const endTime = Date.now();
      // const totalTime = (endTime - startTime) / 1000;
      // console.log(`⏱️ Fetched user data in ${totalTime} seconds`);
  
      return serializeDecimal(user);
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }


export const serializeDecimal = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Decimal) {
    return obj.toNumber(); // or obj.toString() if you need to preserve precision
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeDecimal);
  }

  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeDecimal(value)]),
    );
  }

  return obj;
};

export async function getUserPartnerPreferences(
  currentUser: CachedUser,
): Promise<string[]> {
  if (currentUser?.partnerPreferences) {
    try {
      const preferences = JSON.parse(currentUser.partnerPreferences as string);
      // console.log(`✅ Found ${preferences.length} partner preferences`);
      return preferences.map((pref: any) => pref.partnerName.toLowerCase());
    } catch (error) {
      console.error("❌ Error parsing partner preferences:", error);
      return [];
    }
  }

  console.log("⚠️ No partner preferences found");
  return [];
}

