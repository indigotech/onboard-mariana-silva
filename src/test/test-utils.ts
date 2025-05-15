import axios from "axios";
import { hash } from "bcrypt-ts";
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

const testAxios = axios.create({
  validateStatus: () => true, // Todos os status codes serão considerados válidos
});

export default testAxios;
