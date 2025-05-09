import { hash } from "bcrypt-ts";
import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient } from "../node_modules/.prisma/client/index.js";

const prisma = new PrismaClient();
const PORT: number = 3000;
const app = fastify({ logger: true });

app.get("/hello", async (request: FastifyRequest, reply: FastifyReply) => {
  return { message: "Hello World!" };
});

const UserRequestBodySchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        email: {
          type: "string",
        },
        password: {
          type: "string",
          minLength: 6,
          pattern: "(?=.*[A-Za-z])(?=.*\\d)",
        },
        birthDate: {
          type: "string",
        },
      },
      required: ["name", "email", "password", "birthDate"],
    },
  },
};
interface RequestBody {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}

app.post(
  "/users",
  UserRequestBodySchema,
  async (
    request: FastifyRequest<{ Body: RequestBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { name, email, password, birthDate } = request.body;
      const existingUser = await prisma.user.findUnique({
        where: { email: email },
      });
      if (existingUser) {
        return reply.status(400).send({
          error: "Email is already registered",
          message: "Please try signing up with a different email address.",
        });
      }
      const hashedPassword = await hash(password, 8);
      const newUser = await prisma.user.create({
        data: {
          name: name, // id is automatically incremented
          email: email,
          password: hashedPassword,
          birthDate: new Date(birthDate),
        },
      });
      return reply.code(201).send({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        birthdate: newUser.birthDate,
      });
    } catch (err) {
      request.log.error("Error creating post:", err);
      reply.code(500).send({ error: "Failed to create post" });
    }
  }
);

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
