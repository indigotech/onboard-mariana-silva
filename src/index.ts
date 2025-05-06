import fastify, { FastifyReply, FastifyRequest } from "fastify";
const PORT: number = 3000;
const app = fastify({ logger: true });

app.get("/hello", async (request: FastifyRequest, reply: FastifyReply) => {
  return { message: "Hello World!" };
});

async function start() {
  try {
    await app.listen({ port: PORT });
    console.log(`Server is running at http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
start();
