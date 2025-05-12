import { PrismaClient } from "@prisma/client";
import { connectDB, disconnectDB } from "./setup-db";
import { startServer, stopServer } from "./setup-server";

let prisma: PrismaClient;

export async function start() {
  prisma = await connectDB();
  await startServer(prisma);
  return prisma;
}
export async function stop() {
  await disconnectDB();
  await stopServer();
}
