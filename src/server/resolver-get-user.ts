import { CustomError } from "./error-handler";
import { validateAuthentication } from "./utils";

export async function getUserResolver(_, { id }, context) {
  validateAuthentication(context.request);

  if (isNaN(id) || id <= 0) {
    throw new CustomError(
      "Invalid ID. User ID must be a positive number",
      "USR_02",
      "The user ID must be a positive integer"
    );
  }

  const user = await context.prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
    },
  });

  if (!user) {
    throw new CustomError(
      "User not found",
      "USR_01",
      "User id was not found on the database"
    );
  }

  const { password: __, ...userData } = user;
  return userData;
}
