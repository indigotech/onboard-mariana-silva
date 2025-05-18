import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

faker.seed(0);

async function executeSeeding() {
  console.log("Start seeding...");

  await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;

  const users = await Promise.all(
    Array.from({ length: 50 }).map(async (_, idx) => {
      return prisma.user.create({
        data: {
          name: faker.person.firstName(),
          email: `${idx}--${faker.internet.email()}`,
          password: await hash(faker.internet.password(), 8),
          birthDate: faker.date.birthdate().toISOString(),
          addresses: {
            create: Array.from({
              length: faker.number.int({ min: 0, max: 4 }),
            }).map(() => ({
              CEP: faker.location.zipCode("#####-###"),
              street: faker.location.street(),
              number: faker.number.int({ min: 1, max: 8000 }),
              complement: faker.location.secondaryAddress(),
              neighborhood: faker.location.county(),
              city: faker.location.city(),
              state: faker.location.state(),
            })),
          },
        },
      });
    })
  );

  console.log(`Inserted ${users.length} users`);
  console.log("Seeding completed.");
}

async function seed() {
  executeSeeding()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

await seed();
