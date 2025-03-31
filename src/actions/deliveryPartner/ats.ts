"use server";
import axios from "axios";
import { getDeliveryPartnerToken } from "./tokenManager";
import s3 from "../../lib/s3";
import prisma from "../../lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

export async function uploadFileToS3AtsLabel(
  file: File | null,
  path: string,
  sequenceNumber: number,
): Promise<{ success: boolean; message: string }> {
  if (!file) {
    console.error("AWS_BUCKET_NAME is not defined");
    return { success: false, message: "AWS_BUCKET_NAME is not defined" };
    // throw new Error("No file provided");
  }

  const fileExt = file.name
    ? file.name.split(".").pop() || "unknown"
    : "unknown";
  const originalFileName = file.name ? file.name.split(".")[0] : "unnamed";
  const paddedSequence = String(sequenceNumber).padStart(2, "0");
  const fileName = `${paddedSequence}-${originalFileName}-${Date.now()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();

  // Ensure AWS_S3_BUCKET_NAME is defined
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    return { success: false, message: "AWS_BUCKET_NAME is not defined" };
  }

  const params = {
    Bucket: bucketName,
    Key: filePath,
    Body: Buffer.from(arrayBuffer),
    ContentType: file.type || "application/octet-stream",
  };

  const { Location } = await s3.upload(params).promise();
  return {
    success: true,
    message: Location,
  };
}

function formatAddressLines(address : any, landmark: any) {
  const result = {
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
  };

  if (!address) return result;

  if (address.length <= 60) {
    result.addressLine1 = address;

    if (landmark && landmark.length <= 60) {
      result.addressLine2 = landmark;
    } else if (landmark) {
      result.addressLine3 = landmark;
    }
  } else {
    const breakPoint = address.substring(0, 60).lastIndexOf(" ");
    const splitIndex = breakPoint > 0 ? breakPoint : 60;

    result.addressLine1 = address.substring(0, splitIndex).trim();
    const remainingAddress = address.substring(splitIndex).trim();

    if (landmark && remainingAddress.length + landmark.length + 2 <= 60) {
      result.addressLine2 = `${remainingAddress}, ${landmark}`;
    } else {
      result.addressLine2 = remainingAddress;
      if (landmark) {
        result.addressLine3 = landmark;
      }
    }
  }

  return result;
}

export async function createAtsShipment(orderId: number) {
  try {
    const token = await getDeliveryPartnerToken("ats");

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
      console.error("Eror: ", {
        data: "Order not found",
        path: "deliveryPartner/ats",
      });
      return { success: false, error: "Order not found" };
    }

    if (order.Packages.length === 0) {
      console.error("Error:", {
        data: "No packages found for this order",
        path: "deliveryPartner/ats",
      });
      return { success: false, error: "No packages found for this order" };
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
      console.error("Eror: ", {
        data: "Warehouse address or RTO warehouse address not found",
        path: "deliveryPartner/ats",
      });
      return {
        success: false,
        error: "Warehouse address or RTO warehouse address not found",
      };
    }

    const customerAddress = order.customerAddress;
    if (!customerAddress) {
      console.error("Error: ", {
        data: "Customer address not found",
        path: "deliveryPartner/ats",
      });
      return { success: false, error: "Customer address not found" };
    }

    // Calculate total quantity across all packages
    const totalPackagesQuantity = order.Packages.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );
    //   console.log(totalPackagesQuantity, "totalPackagesQuantity");

    // Calculate weight per unit
    const weightPerUnit =
      Number(order.applicableWeight) / totalPackagesQuantity;

    const requestBody: {
      shipTo: {
        addressLine1: string;
        addressLine2: string;
        addressLine3: string;
        name: string;
        email: string;
        phoneNumber: string;
        city: string;
        stateOrRegion: string;
        countryCode: string;
        postalCode: string;
      };
      shipFrom: object;
      returnTo: object;
      packages: object[];
      taxDetails: object[];
      channelDetails: object;
      serviceSelection: object;
      labelSpecifications: object;
      valueAddedServiceDetails?: object[]; // Add this property
    } = {
      shipTo: {
        name: customerAddress.fullName,
        email: customerAddress.email,
        phoneNumber: customerAddress.contactNumber,
        city: customerAddress.city,
        stateOrRegion: customerAddress.state,
        countryCode: "IN",
        postalCode: customerAddress.pincode?.toString() || "",
        ...formatAddressLines(
          customerAddress.address,
          customerAddress.landmark,
        ),
      },
      shipFrom: {
        name: order.Users.StoreName || warehouseAddress.tag,
        phoneNumber: warehouseAddress.contactNumber,
        city: warehouseAddress.city,
        stateOrRegion: warehouseAddress.state,
        countryCode: "IN",
        postalCode: warehouseAddress.pincode?.toString() || "",
        ...formatAddressLines(
          warehouseAddress.address,
          warehouseAddress.landmark,
        ),
      },
      returnTo: {
        name: order.Users.StoreName || rtoWarehouseAddress.tag,
        phoneNumber: rtoWarehouseAddress.contactNumber,
        city: rtoWarehouseAddress.city,
        stateOrRegion: rtoWarehouseAddress.state,
        countryCode: "IN",
        postalCode: rtoWarehouseAddress.pincode?.toString() || "",
        ...formatAddressLines(
          rtoWarehouseAddress.address,
          rtoWarehouseAddress.landmark,
        ),
      },
      packages: [
        {
          dimensions: {
            length: Number(order.length) || 0,
            width: Number(order.breadth) || 0,
            height: Number(order.height) || 0,
            unit: "CENTIMETER",
          },
          weight: {
            unit: "KILOGRAM",
            value: Number(order.applicableWeight),
          },
          items: order.Packages.map((pkg, index) => ({
            quantity: pkg.quantity,
            weight: {
              unit: "KILOGRAM",
              value: weightPerUnit,
            },
            description: pkg.productName,
            itemIdentifier: `item-${order.id}-${index}`,
            isHazmat: false,
            productType: pkg.category || "N/A",
            itemValue: {
              value: Number(pkg.price),
              unit: "INR",
            },
            invoiceDetails: {
              invoiceNumber: "",
            },
          })),
          isHazmat: false,
          sellerDisplayName:
            order.Users.StoreName || warehouseAddress.tag || "NA",
          insuredValue: {
            unit: "INR",
            value: Number(order.totalOrderValue),
          },
          packageClientReferenceId: `${order.id}`,
        },
      ],
      taxDetails: [
        {
          taxType: "GST",
          taxRegistrationNumber: "anbp1234",
        },
      ],
      channelDetails: {
        channelType: "EXTERNAL",
      },
      serviceSelection: {
        serviceId: ["SWA-IN-OA"],
      },
      labelSpecifications: {
        format: "PDF",
        size: {
          width: 4,
          length: 6,
          unit: "INCH",
        },
        dpi: 203,
        pageLayout: "DEFAULT",
        needFileJoining: false,
        requestedDocumentTypes: ["LABEL"],
      },
    };

    // Add COD details if needed
    if (order.paymentMode?.toLowerCase() !== "prepaid") {
      requestBody["valueAddedServiceDetails"] = [
        {
          id: "CollectOnDelivery",
          amount: {
            unit: "INR",
            value: Number(order.totalOrderValue),
          },
        },
      ];
    }

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://sellingpartnerapi-eu.amazon.com/shipping/v2/oneClickShipment",
      headers: {
        "x-amzn-shipping-business-id": "AmazonShipping_IN",
        "x-amz-access-token": token,
        "Content-Type": "application/json",
      },
      data: requestBody,
    };

    //   console.log(requestBody.packages[0].items[0], requestBody.packages[0].items[1]) ;
    console.log(JSON.stringify(requestBody), "requestBody for ats");

    try {
      const response = await axios.request(config);

      let updatedOrder;

      if (response.data && response.data.payload.shipmentId) {
        const shipmentId = response.data.payload.shipmentId;
        const awbNumber =
          response.data.payload.packageDocumentDetails[0].trackingId;
        const payLoad =
          response.data.payload.packageDocumentDetails[0].packageDocuments[0]
            .contents;
        // Decode the base64 string into a Buffer
        const pdfBuffer = Buffer.from(payLoad, "base64");
        // Create a File object from the Buffer
        const file = new File([pdfBuffer], `${awbNumber}.pdf`, {
          type: "application/pdf",
        });
        const fileUploadLink = await uploadFileToS3AtsLabel(file, awbNumber, 1);
        if (!fileUploadLink.success) {
          return {
            success: false,
            message: "Error Occured in storing label",
          };
        }

        updatedOrder = await prisma.orders.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.READY_TO_SHIP,
            awbNumber: awbNumber,
            responseOrderId: shipmentId,
            shippingDate: new Date(),
            AtsLabel: fileUploadLink.message,
          },
        });
      } else {
        console.error("Invalid response structure from shipping service");
        return {
          success: false,
          message: "Invalid response structure from shipping service ats",
        };
      }

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
        awbNumber:updatedOrder.awbNumber ? updatedOrder.awbNumber.toString() : '',
      };
    } catch (axiosError: any) {
      // Handle Axios errors with detailed messages
      if (axiosError.response) {
        // Extract message and details from response
        const errorObject = axiosError.response.data?.errors?.[0];
        const errorMessage =
          errorObject?.message ||
          axiosError.response.data?.message ||
          axiosError.response.data?.error ||
          "Delivery partner service error";
        const errorDetails = errorObject?.details
          ? ` Details: ${errorObject.details}`
          : "";

        console.log("Full error object:", errorObject);

        console.error("Delivery Partner Error:", {
          status: axiosError.response.status,
          data: errorMessage + errorDetails, // Combine message and details
          path: "deliveryPartner/ats",
        });

        return {
          success: false,
          error: errorMessage + errorDetails, // Return both message and details
          details: axiosError.response.data, // Include full error details for debugging
        };
      } else if (axiosError.request) {
        // The request was made but no response was received
        console.error("Network Error:", {
          error: "No response received from delivery partner",
          path: "deliveryPartner/ats",
        });
        return {
          success: false,
          error:
            "Unable to connect to delivery partner service. Please try again later.",
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request Setup Error:", {
          error: axiosError.message,
          path: "deliveryPartner/ats",
        });
        return {
          success: false,
          error:
            "Failed to process shipping request. Please check the order details and try again.",
        };
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        data: "Error in createAtsShipment:",
        error,
        path: "deliveryPartner/ats",
      }),
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while processing your shipping request",
    };
  }
}

export async function cancelAtsShipment(
  shipmentId?: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const token = await getDeliveryPartnerToken("ats");

    const config = {
      method: "put",
      maxBodyLength: Infinity,
      url: `https://sellingpartnerapi-eu.amazon.com/shipping/v2/shipments/${shipmentId}/cancel`,
      headers: {
        "x-amzn-shipping-business-id": "AmazonShipping_IN",
        "x-amz-access-token": token,
        "Content-Type": "application/json",
      },
    };
    console.log(config, "response from cancelAtsShipment");
    const response = await axios.request(config);
    console.log(response, "response from cancelAtsShipment");
    

    if (response.status === 200 && response.data.payload) {
      const order = await prisma.orders.findFirst({
        where: {
          responseOrderId: shipmentId,
        },
      });

      if (!order) {
        console.error("Error: ", {
          data: "Order not found for the given shipment ID",
          path: "deliveryPartner/ats",
        });
      }
      return {
        success: true,
        error: "Order not found for the given shipment ID",
        message: "Successfully cancelled ATS shipment",
      };
    } else {
      console.error("Eror: ", {
        data: "Failed to cancel shipment with ATS",
        path: "deliveryPartner/ats",
      });
      return {
        success: false,
        error: "Failed to cancel shipment with ATS",
        message: "Failed to cancel shipment with ATS",
      };
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        data: "Error in cancelAtsShipment:",
        error,
        path: "deliveryPartner/ats",
      }),
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function createAmazonNdr(order: any, data: any,action: string) {
  console.log("Starting createAmazonNdr for orderId:", order.orderId);
  console.log("Data:", data);
  
  try {
    const token = await getDeliveryPartnerToken("ats");
    
    const orders = await prisma.orders.findUnique({
      where: { orderId: Number(order.orderId) },
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
    
    if (!orders) {
      return { success: false, error: "Order not found" };
    }
    
    
    let ndrAction = "REATTEMPT"; 
    let ndrRequestData: any = {};
    

 if (data.address) {

      ndrRequestData.additionalAddressNotes = data.address || "";
    }else{
      ndrRequestData.additionalAddressNotes = orders.customerAddress;
    }

    if (action == "rto") {
      console.log("RTO action");
      
      ndrAction = "RTO";
      ndrRequestData = {};
    }
    
    const requestBody = {
      trackingId: orders.awbNumber,
      ndrAction: ndrAction,
      ndrRequestData: ndrRequestData
    };
    
    console.log("Amazon NDR request body:", JSON.stringify(requestBody));
    
    try {
      const response = await axios.post(
        "https://sellingpartnerapi-eu.amazon.com/shipping/v2/ndrFeedback",
        requestBody,
        {
          headers: {
            "x-amzn-shipping-business-id": "AmazonShipping_IN",
            "x-amz-access-token": token,
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log("Amazon NDR Response:", JSON.stringify(response.data));
      
      if (response.data && response.status === 200) {

        if (data.address ) {
          try {
            const customerId = orders.forwardCustomerId || orders.reverseCustomerId;
            
            if (customerId) {
              await prisma.customerAddress.update({
                where: {
                  customerId: customerId
                },
                data: {
                  address: data.address || undefined,
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
          message: `Amazon NDR ${ndrAction.toLowerCase()} submitted successfully`,
          data: response.data 
        };
      } else {

        return { 
          success: false, 
          error: "Failed to submit Amazon NDR feedback"
        };
      }
      
    } catch (apiError) {
      if (axios.isAxiosError(apiError) && apiError.response) {
        console.error("Amazon API Error:", {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: JSON.stringify(apiError.response.data)
        });
        
        // Handle string response data (Amazon sometimes returns JSON as a string)
        let errorData;
        if (typeof apiError.response.data === 'string') {
          try {
            errorData = JSON.parse(apiError.response.data);
          } catch (e) {
            errorData = { message: apiError.response.data };
          }
        } else {
          errorData = apiError.response.data;
        }
        
        // Extract the detailed error message
        let errorMessage = "Error from Amazon API";
        
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // If there are specific details, use them
          if (errorData.errors[0].details) {
            errorMessage = errorData.errors[0].details;
          } else if (errorData.errors[0].message) {
            errorMessage = errorData.errors[0].message;
          }
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
        
        return { success: false, error: errorMessage };
      }
      
      if (apiError instanceof Error) {
        return { success: false, error: apiError.message };
      }
      
      return { success: false, error: "Unknown error occurred while submitting Amazon NDR feedback" };
    }
    
  } catch (error) {
    console.error("Error in createAmazonNdr:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      // Handle string response data
      let errorData;
      if (typeof error.response.data === 'string') {
        try {
          errorData = JSON.parse(error.response.data);
        } catch (e) {
          errorData = { message: error.response.data };
        }
      } else {
        errorData = error.response.data;
      }
      
      // Extract the detailed error message
      let errorMessage = "Unknown API error";
      
      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        // If there are specific details, use them
        if (errorData.errors[0].details) {
          errorMessage = errorData.errors[0].details;
        } else if (errorData.errors[0].message) {
          errorMessage = errorData.errors[0].message;
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      return { success: false, error: errorMessage };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return {
      success: false,
      error: "An unexpected error occurred while submitting Amazon NDR feedback"
    };
  }
}

export async function createAmazonRto(order: any) {
  console.log("Starting createAmazonRto for orderId:", order.orderId);

  
  try {
    const token = await getDeliveryPartnerToken("ats");
    
    const orders = await prisma.orders.findUnique({
      where: { orderId: Number(order.orderId) },
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
    
    if (!orders) {
      return { success: false, error: "Order not found" };
    }
    
    
    
    
    const requestBody = {
      trackingId: orders.awbNumber,
      ndrAction: "RTO",
      ndrRequestData: {}
    };
    
    console.log("Amazon RTO request body:", JSON.stringify(requestBody));
    
    try {
      const response = await axios.post(
        "https://sellingpartnerapi-eu.amazon.com/shipping/v2/ndrFeedback",
        requestBody,
        {
          headers: {
            "x-amzn-shipping-business-id": "AmazonShipping_IN",
            "x-amz-access-token": token,
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log("Amazon RTO Response:", JSON.stringify(response.data));
      
      if (response.data && response.status === 200) {
        
        return { 
          success: true, 
          message: `Amazon RTO submitted successfully`,
          data: response.data 
        };
      } else {

        return { 
          success: false, 
          error: "Failed to submit Amazon RTO feedback"
        };
      }
      
    } catch (apiError) {
      if (axios.isAxiosError(apiError) && apiError.response) {
        console.error("Amazon API Error:", {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: JSON.stringify(apiError.response.data)
        });
        
        // Handle string response data (Amazon sometimes returns JSON as a string)
        let errorData;
        if (typeof apiError.response.data === 'string') {
          try {
            errorData = JSON.parse(apiError.response.data);
          } catch (e) {
            errorData = { message: apiError.response.data };
          }
        } else {
          errorData = apiError.response.data;
        }
        
        // Extract the detailed error message
        let errorMessage = "Error from Amazon API";
        
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // If there are specific details, use them
          if (errorData.errors[0].details) {
            errorMessage = errorData.errors[0].details;
          } else if (errorData.errors[0].message) {
            errorMessage = errorData.errors[0].message;
          }
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
        
        return { success: false, error: errorMessage };
      }
      
      if (apiError instanceof Error) {
        return { success: false, error: apiError.message };
      }
      
      return { success: false, error: "Unknown error occurred while submitting Amazon RTO feedback" };
    }
    
  } catch (error) {
    console.error("Error in createAmazonNdr:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      // Handle string response data
      let errorData;
      if (typeof error.response.data === 'string') {
        try {
          errorData = JSON.parse(error.response.data);
        } catch (e) {
          errorData = { message: error.response.data };
        }
      } else {
        errorData = error.response.data;
      }
      
      // Extract the detailed error message
      let errorMessage = "Unknown API error";
      
      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        // If there are specific details, use them
        if (errorData.errors[0].details) {
          errorMessage = errorData.errors[0].details;
        } else if (errorData.errors[0].message) {
          errorMessage = errorData.errors[0].message;
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      return { success: false, error: errorMessage };
    }
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return {
      success: false,
      error: "An unexpected error occurred while submitting Amazon NDR feedback"
    };
  }
}
