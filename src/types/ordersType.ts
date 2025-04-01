type AddressType = {
    id?: number;
    userid?: string;
    customerId?: number;
    orderId?: number;
    tag?: string;
    personName?: string;
    fullName?: string;
    contactNumber: string;
    email: string;
    alternateNumber?: string;
    buyerCompanyName?: string | null;
    buyerGstin?: string | null;
    address: string;
    landmark?: string;
    pincode: number;
    createdAt: Date;
    city: string;
    state: string;
    country: string;
    defaultAddress?: boolean;
  };
  
  type UserSettings = {
    ShowRto: boolean;
    ShowDangerous: boolean;
    Label_logo: string | null;
    buddyShield: boolean;
  };
  
  type OrderType = {
    id: number;
    orderId: number;
    orderRate: number;
    CODcharges: number | null;
    usersId: string;
    status: "NEW" | string; // Add other status types as needed
    shippingDate: Date;
    pickupTime: Date | null;
    paymentMode: "prepaid" | "COD";
    shippingMode: string | null;
    buddyshieldBoolean: boolean;
    deadWeight: string;
    length: string;
    breadth: string;
    height: string;
    totalOrderValue: string;
    applicableWeight: string;
    isDangerous: boolean;
    deliveryType: "FORWARD" | "REVERSE";
    createdAt: Date;
    awbNumber: string | null;
    deliveryPartner: string | null;
    agentAddressId: number;
    rtoAgentAddressId: number;
    reverseAgentAddressId: number | null;
    forwardCustomerId: number;
    reverseCustomerId: number | null;
    responseOrderId: string | null;
    ChannelOrder_Id: string | null;
    Channels: string | null;
    ShopDomain: string | null;
    Channel_OrderNo: string | null;
    BS_Refund: boolean;
    remittanceId: string | null;
    highshipping_decision: string | null;
    Zone: string | null;
    RtoAwb: string | null;
    invoiceDate: Date | null;
    payedBy: "CREDITS" | string; // Add other payment types as needed
    Packages: any[]; // Replace 'any' with specific package type when available
    customerAddress: AddressType;
    ReversePickupAddress: AddressType | null;
    RtoAddress: AddressType;
    reverseCustomerAddress: AddressType | null;
    PickUpAddress: AddressType;
    DeliveryPartner: string | null;
    Users: UserSettings;
    buddyshield: boolean;
  };
  
  type InputOrderData = {
    Amount: number;
    DeliveryAddressCity: string;
    DeliveryAddressCountry: string;
    DeliveryAddressLine1: string;
    DeliveryAddressPostcode: string;
    DeliveryAddressState: string;
    HSN: string;
    ProductName: string;
    Quantity: number;
    SKU: string;
    applicableWeight: number;
    breadth: number;
    codes: string;
    customerAlternateNumber: string;
    customerName: string;
    customerNumber: string;
    email: string;
    height: number;
    isDangerous: boolean;
    length: number;
    paymentMode: string;
    tag: string;
  };
  
  interface PackageItem {
    ProductName: string;
    Quantity: number;
    SKU: string | undefined;
    HSN: string | undefined;
    applicableWeight: number;
    breadth: number;
    codes: string;
  }
  
  interface TransformedOrder {
    Amount: number;
    DeliveryAddressCity: string;
    DeliveryAddressCountry: string;
    DeliveryAddressLine1: string;
    DeliveryAddressPostcode: number;
    DeliveryAddressState: string;
    customerAlternateNumber: string | undefined;
    customerName: string;
    customerNumber: string;
    email: string;
    height: number;
    isDangerous: boolean;
    length: number;
    paymentMode: string | undefined;
    tag: string;
    packages: PackageItem[];
  }
  
  type CompleteOrderTypeApi = {
    orderData: CreateOrderTypeApi;
    customerAddressList: CustomerAdressTypeApi;
    packageList: PackageDetailNameApi[];
    // deliveryType: 'FORWARD' | 'REVERSE';
  };
  
  type CreateOrderTypeApi = {
    orderId: string | null;
    isDangerousGoods: string;
    deliveryType: any;
    usersId: any;
    status: string;
    shippingDate: string;
    paymentMode?: string;
    deliveryPartner: string;
    deadWeight: number;
    length: number;
    breadth: number;
    height: number;
    agentAddressId?: undefined | number;
    reverseCustomerId?: undefined | number;
    rtoAgentAddressId?: number;
    applicableWeight: number;
    totalOrderValue: number;
    warehouseName: string;
    rtoWarehouseName?: string;
    packageCount: number;
    responseOrderId?: string;
    shippingMode: string;
    buddyShield: boolean;
    // COD:number
    // orderType: string | null
    // isDangerous: boolean  // Changed from isDangerousGoods to isDangerous
  };
  
  type CustomerAdressTypeApi = {
    fullName: string;
    contactNumber: string;
    email: string;
    alternateNumber?: string;
    buyerCompanyName?: string;
    buyerGstin?: string;
    address: string;
    landmark?: string;
    pincode: number;
    createdAt?: string;
    city: string;
    state: string;
  };
  
  type PackageDetailNameApi = {
    name: string;
    qty: number;
    price: number;
    category: string;
    sku?: string;
    hsnCode?: string;
  };
  
  export type {
    OrderType,
    AddressType,
    UserSettings,
    InputOrderData,
    PackageItem,
    TransformedOrder,
    CompleteOrderTypeApi,
    CreateOrderTypeApi,
    CustomerAdressTypeApi,
    PackageDetailNameApi,
  };


 type BaseOrderResponse = {
    orderId: string;
    status: "success" | "failed";
    message: string;
    awbNumber?: string;
    amountDeducted?: number;
    deliveryPartner?: string;
    // Fields for withoutPartner scenario
    createdCount?: number;
    totalTime?: number;
    duplicateOrders?: number;
    missingWarehouses?: number;
    invalidOrders?: number;
  };

  export type OrderResponse = BaseOrderResponse & { atsLabel?: string | null, messageId?: string | null, userId? : string | null };

  
  
 export type BulkOrderResult = {
    success: boolean;
    message: string;
    messageId?: string;
    orderResponses?: OrderResponse[];
    insufficientBalance?: boolean;
    processedOrders?: number;
    fileName?: string;
  };

  export type Wallet_Deduction = {
    userID: string;
    fullname: string;
    OrderValue: number;
    UserBalance: string;
    OrderID: number;
    AWB: string;
    Deduction_Mode: string;
    Deduction_Mode2: string;
    Amount_1: string;
    Amount_2: string;
    Amount_3: string;
    Balance_1: string;
    Balance_2: string;
    Balance_3: string;
  };