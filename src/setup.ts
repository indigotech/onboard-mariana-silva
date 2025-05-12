import { startServer, stopServer } from "./server/setup-server";
import { connectDB, disconnectDB } from "./setup-db";

export async function start() {
  await connectDB();
  await startServer();
}
export async function stop() {
  await disconnectDB();
  await stopServer();
}
