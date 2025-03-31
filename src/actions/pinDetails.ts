import prisma from "../lib/prisma";
import { RateMasterKey } from "../types/rateMasterKey";

export async function pinValidator(pincode: string) {
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
      const postalResponse = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const postalData = await postalResponse.json();
  
      // Check if Postal API returns valid data
      if (postalData?.[0]?.PostOffice?.[0]) {
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
      const shypbuddyResponse = await fetch(
        `https://admin.shypbuddy.net/api/pincode/${pincode}`,
      );
      const shypbuddyData = await shypbuddyResponse.json();
  
      // Check if the Shypbuddy API returns valid data
      if (shypbuddyData?.success && shypbuddyData?.data) {
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
    } catch (err) {
      // Improved error handling, return a structured error response
      console.error("Error fetching pincode details:", err);
      return { error: "Failed to fetch pincode details", details: err };
    }
  }

export async function getPinDetails(pincode: string) {
   
    try {
      const response = await pinValidator(pincode);
  
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
      } else {
        console.error("Invalid response structure for pincode:", pincode);
        return null;
      }
    } catch (error) {
      console.error("Error fetching pin details:", error);
      return null;
    }
  }

  export async function CalculateZone(
    pickup: any,
    drop: any,
  ): Promise<{ status: number; zoneName: RateMasterKey }> {
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
  
      const isSpecialZone = SpecialZones.some(
        (zone) => pickup.state.includes(zone) || drop.state.includes(zone),
      );
      const isSameState = pickup.state === drop.state;
      const isSameRegion = pickup.Region === drop.Region;
  
      if(pickup.state==drop.state)
      {
        console.log("Same State: ", pickup.state, drop.state);
      }
      // console.log(pickup.Region, " Region: ", drop.Region);
      let zoneName: RateMasterKey;
  
      if (isSpecialZone) 
      {
        zoneName = "SpecialZone";
      } 
      else if (isSameState) 
      {
        console.log("Same State: ", pickup.state, drop.state);
        zoneName = isSameRegion ? "WithinCity" : "WithinZone";
      } 
      else 
      {
        zoneName =
          MetroCities.includes(pickup.Region) && MetroCities.includes(drop.Region)
            ? "MetrotoMetro"
            : "RestofIndia";
        // console.log(zoneName, " line 68 ", MetroCities.includes(pickup.Region));
      }
  
      if (MetroCities.includes(pickup.Region)) {
        // console.log("Pickup Region True: ", pickup.Region);
      } else {
        // console.log("False");
      }
      if (MetroCities.includes(drop.Region)) {
        // console.log("drop Region True: ", drop.Region);
      }
  
      return { status: 200, zoneName: zoneName };
    } catch (error) {
      console.log("An error occured in rateCalulator,ts line 71: ", error);
      return { status: 500, zoneName: "No_Zone" };
    }
  }

  type DeliveryData = {
    isReverse: boolean;
    pickupPin: string;
    deliveryPin: string;
    paymentType: string;
  };

export async function findServiceablePartners(data: DeliveryData) {
    try {
      let pickupServiceablePartners: string[];
      let deliveryServiceablePartners: string[];
  
      if (data.isReverse) {
        // For reverse logistics, swap the pincode table lookups
        const pickupPincodeData = await prisma.deliveryPincode.findUnique({
          where: { Pincode: data.pickupPin },
        });
  
        if (!pickupPincodeData) {
          console.error(
            `Pickup pincode ${data.pickupPin} not found in delivery pincode table`,
          );
          return [];
        }
  
        pickupServiceablePartners = pickupPincodeData.Rev;
  
        const deliveryPincodeData = await prisma.pickupPincode.findUnique({
          where: { Pincode: data.deliveryPin },
        });
  
        if (!deliveryPincodeData) {
          console.error(
            `Delivery pincode ${data.deliveryPin} not found in pickup pincode table`,
          );
          return [];
        }
  
        deliveryServiceablePartners = deliveryPincodeData.Serviceable;
      } else {
        // For normal logistics, use the original logic
        const pickupPincodeData = await prisma.pickupPincode.findUnique({
          where: { Pincode: data.pickupPin },
        });
  
        if (!pickupPincodeData) {
          console.error(
            `Pickup pincode ${data.pickupPin} not found in pickup pincode table`,
          );
          return [];
        }
  
        pickupServiceablePartners = pickupPincodeData.Serviceable;
  
        const deliveryPincodeData = await prisma.deliveryPincode.findUnique({
          where: { Pincode: data.deliveryPin },
        });
  
        if (!deliveryPincodeData) {
          console.error(
            `Delivery pincode ${data.deliveryPin} not found in delivery pincode table`,
          );
          return [];
        }
  
        if (data.paymentType === "cod") {
          deliveryServiceablePartners = deliveryPincodeData.Cod;
        } else {
          deliveryServiceablePartners = deliveryPincodeData.Serviceable;
        }
      }
  
      // console.log("Pickup Serviceable Partners:", pickupServiceablePartners);
      // console.log("Delivery Serviceable Partners:", deliveryServiceablePartners);
  
      // Find common serviceable partners
      const commonServiceablePartners = pickupServiceablePartners.filter(
        (partner) => deliveryServiceablePartners.includes(partner),
      );
  
      console.log("type aman: new",data)
  
      if (data.paymentType.toLowerCase() === "prepaid") {
        const index = commonServiceablePartners.indexOf("bluedart");
        if (index > -1) {
        commonServiceablePartners.splice(index, 1);
        }
      }
  
      return commonServiceablePartners;
    } catch (error) {
      console.error("Error in findServiceablePartners:", error);
      return [];
    }
  }