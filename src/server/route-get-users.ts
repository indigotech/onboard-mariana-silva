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
  let userLimit: number;
  if (limit === undefined) {
    userLimit = 20;
  } else if (isNaN(+limit) || +limit < 0) {
    throw new CustomError(
      "Invalid limit. Limit must be a non-negative number.",
      "USR_03",
      "The limit must be a non-negative integer"
    );
  } else {
    userLimit = Number(limit);
  }
  const users = await prisma.user.findMany({
    take: userLimit,
    orderBy: { name: "asc" },
  });

  const usersData = users.map(({ password, ...user }) => user);

  return reply.status(200).send({ users: usersData });
}
