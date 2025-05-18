import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

faker.seed(0);

async function main() {
  console.log("Start seeding...");

  await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY`;

  const users = await Promise.all(
    Array.from({ length: 50 }).map(async (_, idx, __) => ({
      name: faker.person.firstName(),
      email: `${idx}--${faker.internet.email()}`,
      password: await hash(faker.internet.password(), 8),
      birthDate: faker.date.birthdate().toISOString(),
    }))
  );

  const createdUsers = await prisma.user.createMany({
    data: users,
  });

  console.log(`Inserted ${createdUsers.count} users`);
  console.log("Seeding completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
