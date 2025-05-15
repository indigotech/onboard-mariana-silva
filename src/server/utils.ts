import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { User } from "./../generated/prisma/index.d";
import { CustomError } from "./error-handler";

export function validateAuthentication(request: FastifyRequest) {
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

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  birthDate: Date;
}

export function replyUserData(user: User, status: number, reply: FastifyReply) {
  return reply.code(status).send({
    id: user.id,
    name: user.name,
    email: user.email,
    birthDate: user.birthDate,
  });
}
