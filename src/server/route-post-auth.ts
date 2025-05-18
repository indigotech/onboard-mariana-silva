import { compare } from "bcrypt-ts";
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "../setup-db";
import { CustomError } from "./error-handler";
import { PostAuthRequestBody } from "./schemas";

export async function postAuthRoute(
  request: FastifyRequest<{ Body: PostAuthRequestBody }>,
  reply: FastifyReply
) {
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
}
