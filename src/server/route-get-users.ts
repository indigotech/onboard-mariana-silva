import { FastifyRequest } from "fastify";
import { prisma } from "../setup-db";
import { CustomError } from "./error-handler";
import { validateAuthentication } from "./utils";

export async function listUsersRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  validateAuthentication(request);
  const { limit, offset } = request.query;
  let userLimit, userOffset: number;
  if (limit === undefined) {
    userLimit = 20;
  } else if (isNaN(+limit) || +limit < 0) {
    throw new CustomError(
      "Invalid limit. Limit must be a non-negative number.",
      "USR_03",
      "The limit must be a non-negative integer"
    );
  } else {
    userLimit = +limit;
  }

  if (offset === undefined) {
    userOffset = 0;
  } else if (isNaN(+offset) || +offset < 0) {
    throw new CustomError(
      "Invalid offset. Offset must be a non-negative number.",
      "USR_04",
      "The offset must be a non-negative integer"
    );
  } else {
    userOffset = +offset;
  }

  const users = await prisma.user.findMany({
    skip: userOffset,
    take: userLimit,
    orderBy: { name: "asc" },
  });
  const usersData = users.map(({ password, ...user }) => user);
  const previousUser = await getPreviousUser(users);
  const nextUser = await getNextUser(users);

  const total = await prisma.user.count();

  return reply.status(200).send({
    users: usersData,
    total: total,
    offset: userOffset,
    previous: previousUser ?? null,
    next: nextUser ?? null,
  });
}

export async function getPreviousUser(users) {
  const previousUserName = users[0]?.name;
  const previousUser = await prisma.user.findFirst({
    orderBy: { name: "asc" },
    where: { name: { lt: previousUserName } },
  });
  return previousUser?.id;
}

export async function getNextUser(users) {
  const nextUserName = users[users.length - 1]?.name;
  const nextUser = await prisma.user.findMany({
    orderBy: { name: "asc" },
    where: { name: { gt: nextUserName } },
  });
  return nextUser[0]?.id;
}
