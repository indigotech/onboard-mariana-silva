import { hash } from "bcrypt-ts";
import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { prisma } from "../setup-db";
import { RequestBody, UserRequestBodySchema } from "./schemas";

export function buildServer(): FastifyInstance {
  const app = fastify({});

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
  return app;
}
