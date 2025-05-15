import { FastifyRequest } from "fastify";
import { prisma } from "../setup-db";
import { CustomError } from "./error-handler";
import { validateAuthentication } from "./utils";

export async function listUsersRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  validateAuthentication(request);
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
}
