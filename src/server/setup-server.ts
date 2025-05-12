import { FastifyInstance } from "fastify";
import { buildServer } from "./build-server";

const PORT = Number(process.env.PORT) || 3000;
let app: FastifyInstance;

export async function startServer() {
  app = buildServer();
  try {
    await app.listen({ port: PORT });
    console.log(`Server is running at http://localhost:${PORT}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

export async function stopServer() {
  try {
    await app.close();
    console.log("Server stopped");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
