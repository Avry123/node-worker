import { Address } from "@prisma/client";
import { CompleteOrderTypeApi } from "../types/ordersType";
import { CalculateZone, findServiceablePartners, getPinDetails } from "./pinDetails";

export async function selectPartnerForApi(
    orderData: CompleteOrderTypeApi,
    pickupAddress: Address,
    userPartnerPreferences: string[],
  ): Promise<string[] | null> {
    try {
      console.log(`Selecting partner for order: ${orderData.orderData.orderId}`);
      const deliveryData = {
        isReverse: false,
        pickupPin: pickupAddress.pincode.toString(),
        deliveryPin: orderData.customerAddressList.pincode.toString(),
        paymentType: orderData.orderData.paymentMode
          ? orderData.orderData.paymentMode
          : "prepaid",
      };
      // const shadowfaxZoneRestrictedOptions = [
      //   "shadowfax sdd",
      //   "shadowfax ndd",
      //   "shadowfax air ndd",
      //   "shadowfax zonal ndd"
      // ];
      let zoneName: string | null = null;
      try {
        const pickupPinDetails = await getPinDetails(
          pickupAddress.pincode.toString(),
        );
        const deliveryPinDetails = await getPinDetails(
          orderData.customerAddressList.pincode.toString(),
        );
  
        if (pickupPinDetails && deliveryPinDetails) {
          const zoneDetails = await CalculateZone(
            pickupPinDetails,
            deliveryPinDetails,
          );
          zoneName = zoneDetails?.zoneName;
          console.log(
            `📍 Calculated zone for API order ${orderData.orderData.orderId}: ${zoneName}`,
          );
        } else {
          console.error("❌ Could not calculate zone - missing pin details");
        }
      } catch (error) {
        console.error("❌ Error calculating zone:", error);
      }
      let serviceablePartners: string[] = [];
  
      serviceablePartners = (await findServiceablePartners(deliveryData)) || [];
  

      console.log('Line 55 ', serviceablePartners);

      if (serviceablePartners.length === 0) {
        console.log("No serviceable partners available.");
        return null;
      }
  
      // Function to get the first word of a string
      const getMatchingPartnerWords = (str: string): string => {
        if (!str) return "";
        // Special handling for Bluedart
        if (str.toLowerCase().includes("bluedart")) {
          return str.toLowerCase(); // Return the full string for Bluedart cases
        }
        // For all other partners, just return the first word
        return str.split(" ")[0].toLowerCase();
      };
      // Create a set of first words of serviceable partners
      const lowercasedServiceablePartners = serviceablePartners.map((p) =>
        p.toLowerCase(),
      );
  
      const checkServiceability = (partnerToCheck: string): boolean => {
        const partnerMatch = getMatchingPartnerWords(partnerToCheck);
        return lowercasedServiceablePartners.some(
          (p) => getMatchingPartnerWords(p) === partnerMatch,
        );
      };
  
      const air_codes = [
        "bluedart",
        "dtdc air",
        "xpressbees air",
        "delhivery air",
      ];
      const isPartnerValid = (partner: string): boolean => {
        console.log(`🔍 Validating partner: "${partner}"`, {
          isDangerous: orderData.orderData.isDangerousGoods,
          paymentMode: orderData.orderData.paymentMode,
        });
  
        // Check dangerous goods condition
        if (
          orderData.orderData.isDangerousGoods &&
          air_codes.some((code) => partner.toLowerCase() == code)
        ) {
          console.log(
            `❌ Partner "${partner}" rejected: Cannot ship dangerous goods via air`,
          );
          return false;
        }
  
        // Check COD-Bluedart condition
        if (
          orderData.orderData.paymentMode?.toLowerCase() === "prepaid" &&
          partner.toLowerCase() == "bluedart"
        ) {
          console.log(
            `❌ Partner "${partner}" rejected: prepaid not available for Bluedart`,
          );
          return false;
        }
  
        console.log(`✅ Partner "${partner}" is valid`);
        return true;
      };
  
      // Check user preferences for a serviceable partner
      let listOfUserSelectedPreference: string[] = [];
      for (const preferredPartner of userPartnerPreferences) {
        const preferredPartnerMatch = getMatchingPartnerWords(preferredPartner);
        const partnerServiceable = checkServiceability(preferredPartner);
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
        return listOfUserSelectedPreference;
      } else {
        // Incase no delivery partner selected by the delivery partner is serviceable, default to other partners not selected by him
        let listOfDefaultServiceablePartners: string[] = [];
        for (const serviceablePartner of serviceablePartners) {
          if (isPartnerValid(serviceablePartner)) {
            console.log("Line 318 triggered");
            listOfDefaultServiceablePartners.push(serviceablePartner);
          }
        }
        if (listOfDefaultServiceablePartners.length > 0) {
          // return listOfDefaultServiceablePartners;
          return ['delhivery air' ]
        } else {
          // If no delivery partner is serviceable return null.
          return null;
        }
      }
    } catch (error) {
      console.error(
        `Error finding serviceable partners: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return null;
    }
  }