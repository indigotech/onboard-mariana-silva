import axios from "axios";
import { hash } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import { prisma } from "../setup-db";

interface UserData {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}

export async function createUser(test_data: UserData) {
  return await prisma.user.create({
    data: {
      name: test_data.name,
      email: test_data.email,
      password: await hash(test_data.password, 8),
      birthDate: new Date(test_data.birthDate).toISOString(),
    },
  });
}

export function configRequestToken(token: string) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

const validToken = jwt.sign({ id: 1 }, process.env.TOKEN_KEY);

const testAxios = axios.create({
  validateStatus: () => true, // Todos os status codes serão considerados válidos
});

export default { testAxios, validToken };
