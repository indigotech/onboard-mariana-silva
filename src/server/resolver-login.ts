import { compare } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import { CustomError } from "./error-handler";

export async function loginResolver(
  _,
  { input: { email, password, rememberMe } },
  context
) {
  const user = await context.prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new CustomError("Email not registered on platform", "EML_02");
  }

  const { password: userPassword, ...userData } = user;
  const isPasswordValid = await compare(password, userPassword);
  if (!isPasswordValid) {
    throw new CustomError("Wrong password. Try again", "PSW_03");
  }

  const token = jwt.sign({ id: user.id }, process.env.TOKEN_KEY, {
    expiresIn: rememberMe ? "1w" : (Number(process.env.TOKEN_TIMEOUT) ?? 30),
  });

  return {
    user: userData,
    token: token,
  };
}
