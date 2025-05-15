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
  GetUserRequestBody,
  PostAuthBodySchema,
  PostUserBodySchema,
  PostUserRequestBody,
} from "./schemas";

function isAuthenticated(request: FastifyRequest) {
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
}

export function buildServer(): FastifyInstance {
  const app = fastify({});

  app.setErrorHandler(errorHandler);

  app.get("/hello", async () => {
    return { message: "Hello World!" };
  });

  app.post(
    "/users",
    PostUserBodySchema,
    async (
      request: FastifyRequest<{ Body: PostUserRequestBody }>,
      reply: FastifyReply
    ) => {
      isAuthenticated(request);

      const { id, name, email, password, birthDate } = request.body;
      const hashedPassword = await hash(password, 8);
      const newUser = await prisma.user.create({
        data: {
          id: id || undefined,
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
  app.post(
    "/auth",
    PostAuthBodySchema,
    async (
      request: FastifyRequest<{ Body: GetUserRequestBody }>,
      reply: FastifyReply
    ) => {
      const { email, password, rememberMe } = request.body;
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new CustomError("Email not registered on platform", "EML_02");
      } else {
        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
          throw new CustomError("Wrong password. Try again", "PSW_03");
        }
      }

      const token = jwt.sign({ id: user.id }, process.env.TOKEN_KEY, {
        expiresIn: rememberMe ? "1w" : Number(process.env.TOKEN_TIMEOUT) || 30,
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
    }
  );

  app.get(
    "/users/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      isAuthenticated(request);
      const { id } = request.params;

      const userId = Number(id);
      if (isNaN(userId)) {
        throw new CustomError(
          "Invalid ID. User ID must be a number",
          "USR_02",
          "The user ID must be an integer"
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
      });

      if (!user) {
        throw new CustomError(
          "User not found",
          "USR_01",
          "User id was not found on the database"
        );
      }
      return reply.code(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        birthDate: user.birthDate,
      });
    }
  );

  app.get("/users", async (request, reply) => {
    isAuthenticated(request);
    const { limit } = request.query;
    const userLimit = isNaN(Number(limit)) ? 20 : Number(limit);
    if (userLimit < 0) {
      throw new CustomError(
        "Invalid limit. Limit must be a non-negative number.",
        "USR_03",
        "The limit must be a non-negative integer"
      );
    }
    const users = await prisma.user.findMany({
      take: userLimit,
      orderBy: { name: "asc" },
    });
    return reply.status(200).send({ users });
  });

  return app;
}
