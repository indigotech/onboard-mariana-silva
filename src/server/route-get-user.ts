import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../setup-db";
import { CustomError } from "./error-handler";
import { replyUserData, validateAuthentication } from "./utils";

export async function getUserRoute(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  validateAuthentication(request);
  const { id } = request.params;

  const userId = Number(id);
  if (isNaN(userId) || userId <= 0) {
    throw new CustomError(
      "Invalid ID. User ID must be a positive number",
      "USR_02",
      "The user ID must be a positive integer"
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new CustomError(
      "User not found",
      "USR_01",
      "User id was not found on the database"
    );
  }
  return replyUserData(user, 200, reply);
}
