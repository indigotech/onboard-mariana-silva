import { PrismaClient } from "./generated/prisma/index.js";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      id: 2,
      name: "Mariana",
      email: "mariana@hotmail.com",
      password: "senha123",
      birthDate: new Date("2004-10-10"),
    },
  });
  console.log(user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
