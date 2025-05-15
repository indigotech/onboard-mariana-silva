import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../setup-db";
import { CustomError } from "./error-handler";
import { validateAuthentication } from "./validate-authentication";

export async function getUserRoute(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  validateAuthentication(request);
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
