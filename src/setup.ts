import { connectDB, disconnectDB } from "./setup-db";
import { startServer, stopServer } from "./setup-server";

export async function start() {
  await connectDB();
  await startServer();
}
export async function stop() {
  await disconnectDB();
  await stopServer();
}
