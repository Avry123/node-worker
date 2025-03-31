// import { createAbhilayaOrder } from "./deliveryPartner/abhilaya";
import { createAtsShipment } from "./deliveryPartner/ats";
import { createDelhiveryOrder } from "./deliveryPartner/delhivery";
import { createDtdcOrder } from "./deliveryPartner/dtdc";
import { createForwardEcomOrder } from "./deliveryPartner/ecom";
import { createEkartOrder } from "./deliveryPartner/ekart";
import { createOnlineXpressOrder } from "./deliveryPartner/onlinexpress";
import { createShadowfaxOrder } from "./deliveryPartner/shadowfax";
import { createSmartrOrder } from "./deliveryPartner/smartr";
import { createSmartshipOrder } from "./deliveryPartner/smartship";
import { createXpressbeesOrder } from "./deliveryPartner/xpressbees";

export async function createShippingOrderApi(
  orderId: number,
  deliveryPartner: string,
) {
  try {
    console.log("hi", orderId, deliveryPartner);
    let response : any;

    switch (deliveryPartner.toLowerCase()) {
      case "xpressbees":
        response = await createXpressbeesOrder(orderId, "1");
        break;
      case "xpressbees air":
        response = await createXpressbeesOrder(orderId, "6");
        break;
      case "xpressbees 1kg":
        response = await createXpressbeesOrder(orderId, "12298");
        break;
      case "xpressbees 2kg":
        response = await createXpressbeesOrder(orderId, "2");
        break;
      case "xpressbees 5kg":
        response = await createXpressbeesOrder(orderId, "3");
        break;
      case "xpressbees 10kg":
        response = await createXpressbeesOrder(orderId, "4");
        break;
      case "smartr":
        response = await createSmartrOrder(orderId);
        break;
      case "ekart":
      case "ekart logistics":
        response = await createEkartOrder(orderId);
        break;
      case "dtdc":
        response = await createDtdcOrder(orderId, "surface");
        break;
      case "dtdc surface heavy 1kg":
        response = await createDtdcOrder(orderId, "surface");
        break;
      case "dtdc air":
        response = await createDtdcOrder(orderId, "air");
        break;
      case "delhivery":
        response = await createDelhiveryOrder(orderId, "surface", "delhivery");
        break;
      case "delhivery 5kg":
        response = await createDelhiveryOrder(
          orderId,
          "surface",
          "delhivery 5kg",
        );
        break;
      case "delhivery 10kg":
        response = await createDelhiveryOrder(
          orderId,
          "surface",
          "delhivery 10kg",
        );
        break;
      case "delhivery 20kg":
        response = await createDelhiveryOrder(
          orderId,
          "surface",
          "delhivery 20kg",
        );
        break;
      case "delhivery air":
        response = await createDelhiveryOrder(orderId, "air", "delhivery air");
        break;
      case "ats":
      case "ats (amazon transportation services)":
        response = await createAtsShipment(orderId);
        break;
      case "onlinexpress":
        response = await createOnlineXpressOrder(orderId);
        break;
      case "bluedart surface":
        response = await createSmartshipOrder(orderId, "surface");
        break;
      case "bluedart":
        response = await createSmartshipOrder(orderId, "air");
        break;
      case "shadowfax":
        response = await createShadowfaxOrder(orderId,"surface");
        break;
      case "ecom":
        response = await createForwardEcomOrder(orderId);
        break;
      default:
        console.error(`Unsupported delivery partner: ${deliveryPartner}`);
    }

    // Check if response exists and contains error message from partner
    if (!response) {
      console.error(`No response from ${deliveryPartner}`);
    }

    if (response?.error || response?.errorMessage || response?.message) {
      return {
        success: false,
        awbNumber: null,
        partnerError:
          response.error || response.errorMessage || response.message,
      };
    }

    return response;
  } catch (error) {
    console.error(
      `Error creating shipping order for ${deliveryPartner}:`,
      error,
    );
    return {
      success: false,
      awbNumber: null,
      partnerError:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}