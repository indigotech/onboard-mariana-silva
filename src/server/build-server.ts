import { compare, hash } from "bcrypt-ts";
import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "../setup-db";
import { CustomError, errorHandler } from "./error-handler";
import {
  AuthRequestBodySchema,
  RequestBody,
  UserRequestBodySchema,
} from "./schemas";

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
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new CustomError(
          "Authentication failed. Log in, then try again",
          "AUT_01",
          "No authentication token of type Bearer was provided"
        );
      }
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.TOKEN_KEY);
      if (!decoded.id) {
        throw new CustomError(
          "Authentication failed. Try logging in once again",
          "AUT_02",
          "Decoded Payload from authentication token did not match the expected."
        );
      }

      const { id, name, email, password, birthDate } = request.body;
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

  app.post("/auth", AuthRequestBodySchema, async (request, reply) => {
    const { email, password, rememberMe } = request.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new CustomError("Email not registered on platform", "EML_02");
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomError("Wrong password. Try again", "PSW_03");
    }

    const token = jwt.sign({ id: user.id }, process.env.TOKEN_KEY, {
      expiresIn: rememberMe ? "1w" : (Number(process.env.TOKEN_TIMEOUT) ?? 30),
    });

    return reply.code(200).send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        birthDate: user.birthDate,
      },
      token: token,
    });
  });

  return app;
}
