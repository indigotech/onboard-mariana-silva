import "mocha";
import { start, stop } from "../setup";
import { prisma } from "../setup-db";

before(async () => {
  await start();
});

after(async () => {
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await stop();
});

afterEach(async () => {
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
});

import "./test-create-user";
import "./test-get-user";
import "./test-hello";
import "./test-login";
