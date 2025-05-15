import { hash } from "bcrypt-ts";
import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { prisma } from "../setup-db";
import { errorHandler } from "./error-handler";
import { RequestBody, UserRequestBodySchema } from "./schemas";

export function buildServer(): FastifyInstance {
  const app = fastify({});

  app.setErrorHandler(errorHandler);

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
      const { name, email, password, birthDate } = request.body;
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
    }
  );
  return app;
}
