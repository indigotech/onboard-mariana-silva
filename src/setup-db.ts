import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

export async function connectDB() {
  prisma = new PrismaClient();
  await prisma.$connect();
  console.log("Connected to the database");
}

export async function disconnectDB() {
  await prisma.$disconnect();
  console.log("Disconnected from the database");
}

export { prisma };
