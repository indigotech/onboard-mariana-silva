import { hash } from "bcrypt-ts";
import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../setup-db";
import { PostUserRequestBody } from "./schemas";
import { replyUserData, validateAuthentication } from "./utils";

export async function postUserRoute(
  request: FastifyRequest<{ Body: PostUserRequestBody }>,
  reply: FastifyReply
) {
  validateAuthentication(request);

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
  return replyUserData(newUser, 201, reply);
}
