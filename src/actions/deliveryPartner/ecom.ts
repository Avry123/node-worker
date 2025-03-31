"use server";

import axios from "axios";
import { Categories, OrderStatus, Prisma, PrismaClient } from "@prisma/client";
import prisma from "../../lib/prisma";



interface Package {
  orderId: number;
  createdAt: Date;
  image: string | null;
  color: string | null;
  PackageId: number;
  productName: string;
  quantity: number;
  price: string;
  hsn: string | null;
  sku: string | null;
  category: Categories;
  brand: string | null;
  size: string | null;
}

export async function CreateReverseEcomOrder(orderId: number) {
  try {
    console.log("Inside Ecom");

    const responseOrderId =
      orderId + Math.floor(100 + Math.random() * 900).toString();

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        reverseCustomerAddress: true,
        Packages: true,
        Users: {
          select: {
            StoreName: true,
          },
        },
      },
    });

    if (!order) {
      console.error("Order not found");
      return { success: false, error: "Order not found" };
    }

    const pickupAddress = await prisma.customerAddress.findFirst({
      where: {
        customerId: order.reverseAgentAddressId || undefined,
      },
    });

    if (!pickupAddress) {
      console.error("Warehouse address or RTO warehouse address not found");
      return {
        success: false,
        error: "Warehouse address or RTO warehouse address not found",
      };
    }

    const customerAddress = await prisma.address.findFirst({
      where: {
        id: order.reverseCustomerId || undefined,
      },
    });

    if (!customerAddress) {
      console.error("Customer address not found");
      return { success: false, error: "Customer address not found" };
    }

    const collectableAmount = 0;

    // Generate AWB
    const awbParams = new URLSearchParams();
    awbParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED-EXSPLUS713662");
    awbParams.append("password", "Hqd324rJo7");
    awbParams.append("count", "1");
    awbParams.append("type", "EXPP");

    const awbResponse = await axios.post(
      "https://Shipment.ecomexpress.in/services/shipment/products/v2/fetch_awb/",
      awbParams,
    );

    if (awbResponse.data.success !== "yes") {
      console.error("Failed to generate AWB");
    }

    const awb = awbResponse.data.awb;

    // Create product string with payment mode
    const paymentMode = collectableAmount > 0 ? "COD" : "PPD";

    // Create item description with product name and image
    const itemDescription = (order.Packages as Package[])
      .map((pkg: Package) => {
        const productInfo: string[] = [];
        if (pkg.productName) productInfo.push(pkg.productName);
        if (pkg.image) productInfo.push(`Image: ${pkg.image}`);
        return productInfo.join(" - ");
      })
      .filter(Boolean)
      .join(", ");

    // Determine if it's an essential product based on category
    const isEssentialProduct =
      order.Packages[0]?.category === "BabyAndToddler" ||
      order.Packages[0]?.category === "GroceryAndGourmetFood" ||
      order.Packages[0]?.category === "HealthAndHousehold"
        ? "Y"
        : "N";

    // Create manifest
    const manifestParams = new URLSearchParams();
    manifestParams.append(
      "username",
      "SHYPBUDDYINDIAPRIVATELIMITED-EXSPLUS713662",
    );
    manifestParams.append("password", "Hqd324rJo7");
    manifestParams.append(
      "json_input",
      JSON.stringify([
        {
          AWB_NUMBER: awb.toString(),
          ORDER_NUMBER: responseOrderId,
          PRODUCT: paymentMode,
          CONSIGNEE: pickupAddress?.fullName,
          CONSIGNEE_ADDRESS1: pickupAddress?.address,
          DESTINATION_CITY: pickupAddress.city,
          STATE: pickupAddress.state,
          PINCODE: pickupAddress.pincode.toString(),
          TELEPHONE: pickupAddress.contactNumber,
          MOBILE: pickupAddress.contactNumber,
          RETURN_NAME: order?.Users?.StoreName || customerAddress.tag,
          RETURN_MOBILE: customerAddress.contactNumber,
          RETURN_PINCODE: customerAddress.pincode.toString(),
          RETURN_ADDRESS_LINE1: customerAddress.address,
          RETURN_PHONE: customerAddress.alternateNumber,
          PICKUP_NAME: pickupAddress.fullName,
          PICKUP_PINCODE: pickupAddress.pincode.toString(),
          PICKUP_MOBILE: pickupAddress.contactNumber,
          PICKUP_PHONE: pickupAddress.alternateNumber,
          PICKUP_ADDRESS_LINE1: pickupAddress.address,
          COLLECTABLE_VALUE: collectableAmount?.toString(),
          DECLARED_VALUE: order.totalOrderValue?.toString(),
          ITEM_DESCRIPTION: itemDescription,
          DG_SHIPMENT: order.isDangerous ? "Y" : "N",
          PIECES: order.Packages.length,
          LENGTH: order.length + ".0",
          BREADTH: order.breadth + ".0",
          HEIGHT: order.height + ".0",
          VOLUMETRIC_WEIGHT: Number(order.deadWeight),
          ACTUAL_WEIGHT: Number(order.applicableWeight),
          ADDITIONAL_INFORMATION: [{}],
          GST_TAX_RATE_SGSTN: 0,
          GST_TAX_IGSTN: 0,
          DISCOUNT: 0,
          GST_TAX_RATE_IGSTN: 0,
          GST_TAX_BASE: 0,
          GST_TAX_SGSTN: 0,
          INVOICE_DATE: customerAddress.createdAt,
          SELLER_GSTIN: "",
          GST_TAX_RATE_CGSTN: 0,
          GST_HSN: order.Packages[0]?.hsn || "",
          GST_TAX_NAME: "",
          INVOICE_NUMBER: "0",
          GST_TAX_TOTAL: 1,
          GST_TAX_CGSTN: 0,
          GST_ERN: "0",
          ESSENTIAL_PRODUCT: isEssentialProduct,
          CONSIGNEE_LAT: "0",
          CONSIGNEE_LONG: "0",
        },
      ]),
    );

    const manifestResponse = await axios.post(
      "https://shipment.ecomexpress.in/services/expp/manifest/v2/expplus/",
      manifestParams,
    );

    console.log("manifest params:", manifestParams);
    //  console.log('manifest response:', manifestResponse.data.shipments[0]);

    // Check if the manifest response contains a successful shipment
    const successfulShipment = manifestResponse.data.shipments?.[0];
    if (!successfulShipment || !successfulShipment.success) {
      console.error(successfulShipment?.reason || "Manifest creation failed");
    }

    // Only log and update if successful
    //   console.log("AWB generated:", awb);
    //  console.log("Manifest created successfully", manifestResponse.data);

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.READY_TO_SHIP,
        awbNumber: awb.toString(),
        shippingDate: new Date(),
      },
    });

    // revalidatePath("/orders");

    const safeToNumber = (
      value: Prisma.Decimal | null | undefined,
    ): number | null => {
      return value ? value.toNumber() : null;
    };

    return {
      success: true,
      order: {
        ...updatedOrder,
        deadWeight: safeToNumber(updatedOrder.deadWeight),
        breadth: safeToNumber(updatedOrder.breadth),
        height: safeToNumber(updatedOrder.height),
        length: safeToNumber(updatedOrder.length),
        applicableWeight: safeToNumber(updatedOrder.applicableWeight),
        totalOrderValue: safeToNumber(updatedOrder.totalOrderValue),
      },
      awbNumber: awb.toString(),
    };
  } catch (error: any) {
    console.error(
      JSON.stringify({
        message: "Error in CreateReverseEcomOrder:",
        errorDetails: error,
        path: "deliverypartner/ecom",
      }),
    );

    let errorMessage = "An unknown error occurred";

    if (error.response) {
      errorMessage =
        error.response.data.message || "Unknown API error occurred";
    } else if (error.request) {
      errorMessage = "No response received from the server.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

export async function cancelEcomOrder(awbNumber: string) {
  try {
    // console.log("awb",awbNumber);

    const params = new URLSearchParams();
    params.append("username", "SHYPBUDDYINDIAPRIVATELIMITED-EXSPLUS713662");
    params.append("password", "Hqd324rJo7");
    params.append("awbs", awbNumber);

    //  console.log("cancel params: ", params);

    const response: any = await axios.post(
      "https://api.ecomexpress.in/apiv2/cancel_awb/",
      params,
    );
    // console.log("Order cancellation response:", response.data);
    if (
      response.data[0].success == true ||
      response.data[0].reason ==
        "Shipment Cannot Be Cancelled As RTO Lock Already Applied"
    ) {
      console.log(
        `Order with AWB number ${awbNumber} has been successfully cancelled.`,
      );
      return { success: true, message: "Order was successfully canceled" };
    }
    return { success: false, message: "Order cancellation failed" };
  } catch (error: any) {
    console.error(
      JSON.stringify({
        message: "Error cancelling Ecom order:",
        errorDetails: error,
        path: "deliverypartner/ecom",
      }),
    );

    if (error.response && error.response.data) {
      console.error(
        JSON.stringify({
          message: "Error cancelling Ecom order:",
          errorDetails: error.response.data,
          path: "deliverypartner/ecom",
        }),
      );
    }
    return { success: false, message: "Failed to cancel Ecom order" };
  }
}

function generateRandomOrderId(orderId: any) {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${orderId}-${randomNum}`;
}

export async function createForwardEcomOrder(orderId: number) {
  try {
    console.log("Inside Forward Ecom Order Creation");

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        customerAddress: true,
        Packages: true,
        Users: {
          select: {
            StoreName: true,
          },
        },
      },
    });

    if (!order) {
      console.error("Order not found");
      return { success: false, message: "Order not found" };
    }

    const warehouseAddress = await prisma.address.findFirst({
      where: {
        id: order.agentAddressId || undefined,
      },
    });

    const rtoWarehouseAddress = await prisma.address.findUnique({
      where: { id: order.rtoAgentAddressId ?? undefined },
    });

    if (!warehouseAddress || !rtoWarehouseAddress) {
      console.error("Warehouse address or RTO warehouse address not found");
      return {
        success: false,
        message: "Warehouse address or RTO warehouse address not found",
      };
    }

    const customerAddress = order.customerAddress;
    if (!customerAddress) {
      console.error("Customer address not found");
      return { success: false, message: "Customer address not found" };
    }

    // Determine if it's a heavy weight shipment (>5 KG)
    const isHeavyWeight = Number(order.applicableWeight) > 5;

    // Determine AWB type based on payment mode and weight
    let awbType;

    awbType = order.paymentMode?.toLowerCase() === "prepaid" ? "PPD" : "COD";

    const collectableAmount =
      order.paymentMode?.toLowerCase() === "prepaid"
        ? 0
        : order.totalOrderValue;

    // Format product names for ITEM_DESCRIPTION
    const productNames = order.Packages.map((pkg) => pkg.productName)
      .filter(Boolean)
      .join(", ");

    const hsn = order.Packages.map((pkg) => pkg.hsn)
      .filter(Boolean)
      .join(", ");

    const orderCategory = order.Packages[0]?.category;

    // Determine if it's an essential product based on category
    const isEssentialProduct =
      orderCategory === "BabyAndToddler" ||
      "GroceryAndGourmetFood" ||
      "HealthAndHousehold"
        ? "Y"
        : "N";

    // Fetch AWB number
    const awbParams = new URLSearchParams();
    awbParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
    awbParams.append("password", "w5kzZECMxO");
    awbParams.append("count", "1");
    awbParams.append("type", awbType);

    const awbResponse = await axios.post(
      "https://api.ecomexpress.in/apiv2/fetch_awb/",
      awbParams,
    );

    if (awbResponse.data.success !== "yes") {
      console.error("Failed to generate AWB");
    }

    const awb = awbResponse.data.awb;

    // Create manifest
    const manifestParams = new URLSearchParams();
    manifestParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
    manifestParams.append("password", "w5kzZECMxO");
    manifestParams.append(
      "json_input",
      JSON.stringify([
        {
          AWB_NUMBER: awb.toString(),
          ORDER_NUMBER: generateRandomOrderId(order.orderId),
          PRODUCT: awbType,
          CONSIGNEE: customerAddress.fullName,
          CONSIGNEE_ADDRESS1: customerAddress.address,
          DESTINATION_CITY: customerAddress.city,
          STATE: customerAddress.state,
          PINCODE: customerAddress.pincode.toString(),
          TELEPHONE: customerAddress.contactNumber,
          MOBILE: customerAddress.contactNumber,
          RETURN_NAME: order?.Users?.StoreName || rtoWarehouseAddress.tag,
          RETURN_MOBILE:
            rtoWarehouseAddress.contactNumber || warehouseAddress.contactNumber,
          RETURN_PINCODE:
            rtoWarehouseAddress.pincode.toString() ||
            warehouseAddress.pincode.toString(),
          RETURN_ADDRESS_LINE1:
            rtoWarehouseAddress.address || warehouseAddress.address,
          RETURN_PHONE:
            rtoWarehouseAddress.alternateNumber ||
            warehouseAddress.alternateNumber,
          PICKUP_NAME: order?.Users?.StoreName || warehouseAddress.tag,
          PICKUP_PINCODE: warehouseAddress.pincode.toString(),
          PICKUP_MOBILE: warehouseAddress.contactNumber,
          PICKUP_PHONE: warehouseAddress.alternateNumber,
          PICKUP_ADDRESS_LINE1: warehouseAddress.address,
          COLLECTABLE_VALUE: collectableAmount?.toString(),
          DECLARED_VALUE: order.totalOrderValue?.toString(),
          ITEM_DESCRIPTION: productNames || "No items",
          DG_SHIPMENT: order.isDangerous ? "Y" : "N",
          PIECES: order.Packages.length,
          LENGTH: order.length + ".0",
          BREADTH: order.breadth + ".0",
          HEIGHT: order.height + ".0",
          VOLUMETRIC_WEIGHT: Number(order.deadWeight),
          ACTUAL_WEIGHT: Number(order.applicableWeight),
          ADDITIONAL_INFORMATION: {
            GST_TAX_CGSTN: "0",
            GST_TAX_IGSTN: "0",
            GST_TAX_SGSTN: "0",
            SELLER_GSTIN: "",
            INVOICE_DATE: new Date().toLocaleDateString(),
            INVOICE_NUMBER: order.orderId,
            GST_TAX_RATE_SGSTN: "0",
            GST_TAX_RATE_IGSTN: "0",
            GST_TAX_RATE_CGSTN: "0",
            GST_HSN: hsn || "NA",
            GST_TAX_BASE: "0",
            GST_TAX_NAME: "",
            ESSENTIALPRODUCT: isEssentialProduct,
            GST_TAX_TOTAL: "0",
            CONSIGNEE_LONG: "0",
            CONSIGNEE_LAT: "0",
            what3words: "tall.basically.flattered",
          },
        },
      ]),
    );

    const manifestResponse = await axios.post(
      "https://api.ecomexpress.in/apiv2/manifest_awb/",
      manifestParams,
    );
    console.log("hi", manifestResponse.data);

    const failedShipment = manifestResponse.data.shipments?.[0];
    if (!failedShipment || !failedShipment.success) {
      let errorReason = `Manifest creation failed for Order ID: ${orderId}`;

      // Extract specific error reason if available
      if (failedShipment && failedShipment.reason) {
        errorReason = `Order ID ${orderId}: ${failedShipment.reason}`;
      }
    }

    // Check if the manifest response contains a successful shipment
    const successfulShipment = manifestResponse.data.shipments?.[0];
    if (
      !successfulShipment ||
      successfulShipment.success === false ||
      successfulShipment.reason === "CONSIGNEE_PINCODE_NOT_SERVICED"
    ) {
      console.error("Manifest creation failed");
      return { success: false, error: successfulShipment.reason };
    }

    // Only log and update if successful
    //  console.log("AWB generated:", awb);
    //    console.log("Manifest created successfully", manifestResponse.data);

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.READY_TO_SHIP,
        awbNumber: awb.toString(),
        shippingDate: new Date(),
      },
    });

    // revalidatePath("/orders");

    const safeToNumber = (
      value: Prisma.Decimal | null | undefined,
    ): number | null => {
      return value ? value.toNumber() : null;
    };

    return {
      success: true,
      order: {
        ...updatedOrder,
        deadWeight: safeToNumber(updatedOrder.deadWeight),
        breadth: safeToNumber(updatedOrder.breadth),
        height: safeToNumber(updatedOrder.height),
        length: safeToNumber(updatedOrder.length),
        applicableWeight: safeToNumber(updatedOrder.applicableWeight),
        totalOrderValue: safeToNumber(updatedOrder.totalOrderValue),
      },
      awbNumber: awb.toString(),
    };
  } catch (error: any) {
    console.error("Error in createForwardEcomOrder:", error);

    let errorMessage = "An unknown error occurred";

    if (error.response) {
      errorMessage =
        error.response.data.message || "Unknown API error occurred";
    } else if (error.request) {
      errorMessage = "No response received from the server.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

export async function CancelForwardEcom(awbNumber: string) {
  try {
    console.log("In cancel for ecom");
    const cancelParams = new URLSearchParams();
    cancelParams.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
    cancelParams.append("password", "w5kzZECMxO");
    cancelParams.append("awbs", awbNumber);

    const cancelResponse = await axios.post(
      "https://api.ecomexpress.in/apiv2/cancel_awb/",
      cancelParams,
    );

    const responseData = cancelResponse.data;

    if (Array.isArray(responseData) && responseData.length > 0) {
      const cancellationResult = responseData[0];

      if (
        cancellationResult.success === true ||
        (cancellationResult.success === false &&
          cancellationResult.reason === "INCORRECT_AIRWAYBILL_NUMBER") ||
        "Shipment Cannot Be Cancelled As RTO Lock Already Applied"
      ) {
        console.log(`AWB ${awbNumber} handled successfully`);

        return {
          success: true,
          message: `AWB ${awbNumber} handled successfully. Reason: ${cancellationResult.reason}`,
        };
      } else {
        console.error(
          JSON.stringify({
            message: `Failed to cancel AWB ${awbNumber}: ${cancellationResult.reason}`,
            path: "deliverypartner/ecom",
          }),
        );

        return {
          success: false,
          message: `Failed to cancel AWB ${awbNumber}: ${cancellationResult.reason}`,
        };
      }
    } else {
      console.error("Unexpected response format from cancel AWB API");
      return {
        success: false,
        message: "Unexpected response format from cancel AWB API",
      };
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        message: `Error cancelling AWB ${awbNumber}: ${error}`,
        path: "deliverypartner/ecom",
      }),
    );

    return {
      success: false,
      message: `Error cancelling AWB ${awbNumber}.`,
    };
  }
}

export async function createEcomExpressNdr(order: any, data: any, action: string) {
  console.log("Starting createEcomExpressNdr for AWB:", order.awbNumber);
  console.log("Data:", data);
  
  try {

    const orders = await prisma.orders.findUnique({
      where: { orderId: Number(order.orderId) },
      include: {
        customerAddress: true,
        
      },
    });
    
    if (!orders) {
      return { success: false, error: "Order not found" };
    }
    
    let instruction = "";
    if (action === "ndr") {
      instruction = "RAD"; 
    } else if (action === "rto") {
      instruction = "RTO";
    } else {
      return { success: false, error: "Invalid action specified" };
    }

    const ndrRequest: any = {
      awb: order.awbNumber,
      instruction: instruction,
      comments: action === "ndr" ? "Reattempt requested" : "RTO Requested"
    };
    
    if (action === "ndr") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = tomorrow.toISOString().split('T')[0].replace(/-/g, '-');
      
      ndrRequest.scheduled_delivery_date =  formattedDate;
      ndrRequest.scheduled_delivery_slot =  "1"; // Default to slot 1

      if (data?.address) {

        const addressLines = data.address.split('\n', 4);
        ndrRequest.consignee_address = {
          CA1: addressLines[0] || "",
          CA2: addressLines[1] || "",
          CA3: addressLines[2] || "",
          CA4: addressLines[3] || ""
        };
      }
      
      if (data?.phone) {
        ndrRequest.mobile = data.phone;
      }
    }
    
    console.log("Ecom Express NDR request:", JSON.stringify([ndrRequest]));
    
    // Create form data
    const formData = new FormData();
    formData.append("username", "SHYPBUDDYINDIAPRIVATELIMITED529583");
    formData.append("password", "w5kzZECMxO");
    formData.append("json_input", JSON.stringify([ndrRequest]));
    try {
      const response = await axios.post(
        "https://api.ecomexpress.in/apiv2/ndr_resolutions/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      console.log("Ecom Express NDR Response:", JSON.stringify(response.data));
      
      let responseData = response.data;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          console.error("Error parsing response data:", parseError);
        }
      }
      
      if (Array.isArray(responseData) && responseData.length > 0) {
        const responseItem = responseData[0];
        
        if (responseItem.status === "true" || responseItem.success === true) {

          if ((data.address || data.phone) && action === "ndr") {
            try {
              const customerId = orders.forwardCustomerId || orders.reverseCustomerId;
              
              if (customerId) {
                await prisma.customerAddress.update({
                  where: {
                    customerId: customerId
                  },
                  data: {
                    address: data.address || undefined,
                    contactNumber: data.phone || undefined
                  }
                });
                console.log("Customer address updated successfully");
              }
            } catch (dbError) {
              console.error("Error updating customer address:", dbError);
            }
          }
          
          return { 
            success: true, 
            message: `Ecom Express ${action === "ndr" ? "reattempt" : "RTO"} created successfully`,
            data: responseItem
          };
        } else {

          let errorMessage = `Failed to create Ecom Express ${action}`;
          
          if (responseItem.error && Array.isArray(responseItem.error) && responseItem.error.length > 0) {
            errorMessage = responseItem.error[0];
          } else if (responseItem.reason) {
            errorMessage = responseItem.reason;
          }
          
          return { 
            success: false, 
            error: errorMessage
          };
        }
      }
      
      return { 
        success: false, 
        error: "Invalid response format from Ecom Express API"
      };
      
    } catch (apiError) {
      if (axios.isAxiosError(apiError) && apiError.response) {
        console.error("Ecom Express API Error:", {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: JSON.stringify(apiError.response.data)
        });
        
        if (apiError.response.status === 401) {
          return { 
            success: false, 
            error: "Authentication failed. Please check credentials or contact support."
          };
        }

        let responseData = apiError.response.data;
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
          } catch (parseError) {
            console.error("Error parsing error response data:", parseError);
          }
        }
        
        let errorMessage = "Error communicating with Ecom Express";
        
        if (Array.isArray(responseData) && responseData.length > 0) {
          const responseItem = responseData[0];
          if (responseItem.error && Array.isArray(responseItem.error) && responseItem.error.length > 0) {
            errorMessage = responseItem.error[0];
          } else if (responseItem.reason) {
            errorMessage = responseItem.reason;
          }
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData?.reason) {
          errorMessage = responseData.reason;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        }
        
        return { success: false, error: errorMessage };
      }
      
      if (apiError instanceof Error) {
        return { success: false, error: apiError.message };
      }
      
      return { success: false, error: "Unknown error occurred while creating Ecom Express NDR" };
    }
    
  } catch (error) {
    console.error("Error in createEcomExpressNdr:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      // Handle specific error codes
      if (error.response.status === 401) {
        return { 
          success: false, 
          error: "Authentication failed. Please check credentials or contact support."
        };
      }
      
      // Handle error response that might be a string (JSON string)
      let responseData = error.response.data;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          console.error("Error parsing error response data:", parseError);
        }
      }
      
      // Extract error message from various response formats
      let errorMessage = "Error communicating with Ecom Express";
      
      if (Array.isArray(responseData) && responseData.length > 0) {
        const responseItem = responseData[0];
        if (responseItem.error && Array.isArray(responseItem.error) && responseItem.error.length > 0) {
          errorMessage = responseItem.error[0];
        } else if (responseItem.reason) {
          errorMessage = responseItem.reason;
        }
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData?.reason) {
        errorMessage = responseData.reason;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      }
      
      return { success: false, error: errorMessage };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return {
      success: false,
      error: "An unexpected error occurred while creating Ecom Express NDR request"
    };
  }
}