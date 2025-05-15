import "mocha";
import { start, stop } from "../setup";
import { prisma } from "../setup-db";

before(async () => {
  await start();
});

after(async () => {
  await prisma.user.deleteMany();
  await stop();
});

afterEach(async () => {
  await prisma.user.deleteMany();
});

import "./test-create-user";
import "./test-hello";
import "./test-login";
