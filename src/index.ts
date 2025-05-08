import { PrismaClient } from "@prisma/client";
import fastify from "fastify";

const prisma = new PrismaClient();
const PORT = 3000;
const app = fastify({ logger: true });

app.get("/hello", async () => {
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
      const newUser = await prisma.user.create({
        data: {
          name: name, // id is automatically incremented
          email: email,
          password: password,
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
