"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWarehouseDetails = getWarehouseDetails;
const prisma_1 = __importDefault(require("../lib/prisma"));
function getWarehouseDetails(warehouseName, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield prisma_1.default.address.findMany({
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
        }
        catch (error) {
            console.error(JSON.stringify({
                data: "No Warehouse Details Found",
                path: "/actions/warehouse/address.ts",
                error: error,
            }));
            return {
                success: false,
                message: error,
            };
        }
    });
}
