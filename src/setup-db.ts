import { PrismaClient } from "@prisma/client";
let prisma: PrismaClient;

export async function connectDB() {
  prisma = new PrismaClient();
  await prisma.$connect();
  return prisma;
}

export async function disconnectDB() {
  await prisma.$disconnect();
}
