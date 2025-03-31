type PaymentMethod = "PREPAID" | "POSTPAID_COD" | "POSTPAID_INVOICE"

export type CachedUser = {
    userid: string;
    email: string;
    fullname: string;
    phone: string;
    kyc: boolean;
    buddyShield: boolean;
    negotiation: boolean;
    paymentMethod: PaymentMethod;
    cardLimit: number | null;
    specialRatesEnabled: boolean;
    PaymentSheet: boolean;
    partnerPreferences: any;
    earlyCod: number | null;
    storeName: string;
    userPreferences: any[];
    warehouses: any[];
    userRates: any[];
  } | null;