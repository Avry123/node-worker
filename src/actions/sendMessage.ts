import axios from "axios";
import prisma from "../lib/prisma";
import { CachedUser } from "../types/userTypes";

export async function sendOrderSMS(orderId: number, user: CachedUser) {
  const currentUser = user;
  try {
    const startTime = Date.now();
    if (!currentUser) {
      console.log("User authentication failed. Please log in again.");
      return { success: false, message: "No current user found" };
    }
    console.log(`Current user: ${currentUser.userid}`);

    const orderDetails = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        customerAddress: true,
      },
    });

    if (!orderDetails || !orderDetails.customerAddress) {
    console.error("Order or customer details not found");
    return { success: false, message: "Invalid order ID" };

    }

    const phoneNumber = orderDetails.customerAddress.contactNumber;
    if (!phoneNumber) {
    console.error("Customer contact number is missing");
    return { success: false, message: "Invalid phone number" };
    }

    const options = {
      method: "POST",
      url: "https://control.msg91.com/api/v5/flow",
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        accept: "application/json",
        "content-type": "application/json",
      },
      data: {
        template_id: "67389037d6fc05116a123072",
        short_url: "0",
        realTimeResponse: "1",
        recipients: [
          {
            mobiles: `91${phoneNumber}`,
            var1: orderDetails.customerAddress.fullName,
            var2: orderDetails.awbNumber || "N/A",
            var3: user?.storeName || "",
          },
        ],
      },
    };

    // console.log("SMS Options:", JSON.stringify(options.data, null, 2));

    const { data } = await axios.request(options);
    // console.log("SMS notification sent successfully:", data);
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    console.log(`⏱️ get SEND ORDER SMS: ${totalTime} seconds`);
    return { success: true, data };
  } 
  catch (error) 
  {
    console.error("Error sending SMS notification:", error);
    return {
      success: false,
      error:"Failed to send SMS notification",
    };
  }
}