import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";
import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
const PORT = 3000;

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
let app: FastifyInstance;
function buildServer(prisma: PrismaClient) {
  app = fastify();

  app.get("/hello", async () => {
    return { message: "Hello World!" };
  });

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
            name: name,
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
}
export async function startServer(prisma: PrismaClient) {
  buildServer(prisma);
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
