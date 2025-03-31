"use server";

import axios from "axios";


interface ITokenManager {
  getToken(): Promise<string>;
}

abstract class TokenManager implements ITokenManager {
  protected token: string | null | undefined = null;
  protected tokenExpiration: Date | null = null;

  abstract generateToken(): Promise<void>;

  protected isTokenValid(): boolean {
    if (!this.token || !this.tokenExpiration) {
      return false;
    }
    return this.tokenExpiration.getTime() > Date.now() + 5 * 60 * 1000; // 5 minutes buffer
  }

  public async getToken(): Promise<string> {
    if (!this.isTokenValid()) {
      await this.generateToken();
    }
    return this.token!;
  }
}

class XpressBeesTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      const authResponse = await axios.post(
        "https://shipment.xpressbees.com/api/users/login",
        {
          email: process.env.XPRESSBEES_EMAIL,
          password: process.env.XPRESSBEES_PASSWORD,
        },
      );
      this.token = authResponse.data.data;
      this.tokenExpiration = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours expiration
    } catch (error) {
      console.error("Error generating XpressBees token:", error);
    }
  }
}

class SmartrTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      const authResponse = await axios.post(
        "https://api.smartr.in/api/v1/get-token/",
        {
          username: process.env.SMARTR_USERNAME,
          password: process.env.SMARTR_PASSWORD,
        },
      );
      this.token = authResponse.data.data.access_token;
      this.tokenExpiration = new Date(Date.now() + 10 * 60 * 60 * 1000); // 10 hours expiration
    } catch (error) {
      console.error("Error generating Smartr token:", error);
    }
  }
}
class EkartTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      const authResponse = await axios.post(
        "https://api.ekartlogistics.com/auth/token?",
        {},
        {
          headers: {
            Authorization: `Basic ${process.env.EKART_AUTH_TOKEN}`,
            "Content-Type": "application/json",
            HTTP_X_MERCHANT_CODE: process.env.EKART_MERCHANT_CODE,
          },
        },
      );
      this.token = authResponse.data.Authorization;
      this.tokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hours expiration
    } catch (error) {
      console.error("Error generating Ekart token:", error);
    }
  }
}

class DtdcTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      this.token = process.env.DTDC_TOKEN;
    } catch (error) {
      console.error("Invalid Dtdc token:", error);
    }
  }
}
class ShadowfaxTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      this.token = process.env.SHADOWFAX_TOKEN;
    } catch (error) {
      console.error("Invalid ShadowFax token:", error);
    }
  }
}

class ShadowfaxSDDTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      this.token = process.env.SHADOWFAXSDD_TOKEN;
    } catch (error) {
      console.error("Invalid ShadowFax SDD token:", error);
    }
  }
}

class DelhiveryTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      this.token = process.env.DELHIVERY_TOKEN;
    } catch (error) {
      console.error("Invalid Delhivery token:", error);
    }
  }
}
class DelhiveryAirTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      this.token = process.env.DELHIVERYAIR_TOKEN;
    } catch (error) {
      console.error("Invalid Delhivery token:", error);
    }
  }
}
class Delhivery5kgTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      this.token = process.env.DELHIVERY5KG_TOKEN;
    } catch (error) {
      console.error("Invalid Delhivery token:", error);
    }
  }
}
class Delhivery10kgTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      this.token = process.env.DELHIVERY10KG_TOKEN;
    } catch (error) {
      console.error("Invalid Delhivery token:", error);
    }
  }
}
class Delhivery20kgTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      this.token = process.env.DELHIVERY20KG_TOKEN;
    } catch (error) {
      console.error("Invalid Delhivery token:", error);
    }
  }
}

class AtsTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      const authResponse = await axios.post(
        "https://api.amazon.com/auth/o2/token",
        {
          grant_type: "refresh_token",
          refresh_token: process.env.ATS_REFRESH_TOKEN,
          client_id: process.env.ATS_CLIENT_ID,
          client_secret: process.env.ATS_CLIENT_SECRET,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      this.token = authResponse.data.access_token;
      this.tokenExpiration = new Date(
        Date.now() + authResponse.data.expires_in * 1000,
      ); // 1 hours expiration (3600 seconds)
    } catch (error) {
      console.error("Error generating ATS token:", error);
    }
  }
}

class BlueDart_Air extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      console.log("Blue Dart Air");

      const authResponse = await axios.get(
        "https://apigateway.bluedart.com/in/transportation/token/v1/login",
        {
          headers: {
            ClientID: "jvGvrGgVG0tjU7yWqpHevxkubUUocxpH",
            clientSecret: "IQ4LkQGgXa0VnZC8",
          },
        },
      );

      // console.log(authResponse," bluedart air token");

      this.token = authResponse.data.JWTToken;
      this.tokenExpiration = new Date(
        Date.now() + authResponse.data.expires_in * 1000,
      );
    } catch (error) {
      console.error("Error generating SmartShip token:", error);
    }
  }
}

class SmartShipTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      console.log("Smart ship lin2");
      console.log(process.env.SMARTSHIP_USERNAME, " line 190");

      // const response = await fetch('https://oauth.smartship.in/loginToken.php')

      const authResponse = await axios.post(
        "https://oauth.smartship.in/loginToken.php",
        {
          username: "" + process.env.SMARTSHIP_USERNAME + "",
          password: "" + process.env.SMARTSHIP_PASSWORD + "",
          client_id: "" + process.env.SMARTSHIP_CLIENT_ID + "",
          client_secret: "7Z*6F!&7IRWVJTW_B#$Z7L7",
          grant_type: "password",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      this.token = authResponse.data.access_token;
      this.tokenExpiration = new Date(
        Date.now() + authResponse.data.expires_in * 1000,
      ); // 1 hours expiration (3600 seconds)
    } catch (error) {
      console.error("Error generating SmartShip token:");
    }
  }
}

class OnlineXpressTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      this.token = "83281572da57c6ce5ffe9889183ab444";
    } catch (error) {
      console.error("Invalid OnlineXpress token:", error);
    }
  }
}

class AbhilayaTokenManager extends TokenManager {
  async generateToken(): Promise<void> {
    try {
      console.log("Generating Abhilaya test token...");
      const authResponse = await axios.post(
        "https://oneworld.isopronto.com/token",
        {
          grant_type: "password",
          username: process.env.ABHILAYA_USERNAME,
          password: process.env.ABHILAYA_PASSWORD,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.token = authResponse.data.access_token;
      this.tokenExpiration = new Date(
        Date.now() + authResponse.data.expires_in * 1000,
      );
      console.log("Abhilaya test token generated successfully.");
    } catch (error) {
      console.error("Error generating Abhilaya test token:", error);
    }
  }
}

class TokenManagerFactory {
  private static managers: { [key: string]: ITokenManager } = {
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
    shadowfaxsdd:new ShadowfaxSDDTokenManager(),
    ats: new AtsTokenManager(),
    smartship: new SmartShipTokenManager(),
    bluedart_air: new BlueDart_Air(),
    abhilaya: new AbhilayaTokenManager(),
    onlinexpress: new OnlineXpressTokenManager(),
  };

  static getTokenManager(partner: string): ITokenManager {
    const manager = this.managers[partner];
    if (!manager) {
      console.error(`No token manager found for partner: ${partner}`);
    }
    return manager;
  }
}

export async function getDeliveryPartnerToken(
  partner: string,
): Promise<string> {
  const tokenManager = TokenManagerFactory.getTokenManager(
    partner.toLowerCase(),
  );

  return tokenManager.getToken();
}
