import prisma from "../lib/prisma";

export async function getWarehouseDetails(
    warehouseName: string,
    userId: string,
  ) {
    try {
      const data = await prisma.address.findMany({
        where: {
          tag: warehouseName,
          userid: userId,
        },
        select: {
          id: true,
          tag: true,
          personName: true,
          contactNumber: true,
          email: true,
          alternateNumber: true,
          address: true,
          landmark: true,
          pincode: true,
          city: true,
          state: true,
          country: true,
          defaultAddress: true,
          userid: true,
          createdAt: true,
        },
      });
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error(
        JSON.stringify({
          data: "No Warehouse Details Found",
          path: "/actions/warehouse/address.ts",
          error: error,
        }),
      );
      return {
        success: false,
        message: error,
      };
    }
  }