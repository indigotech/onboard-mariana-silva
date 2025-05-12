import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { compare } from "bcrypt-ts";
import { expect } from "chai";
import "mocha";
import { start, stop } from "../setup";

let prisma: PrismaClient;

before(async () => {
  prisma = await start();
});

after(async () => {
  await prisma.user.deleteMany();
  await stop();
});

describe("Server", function () {
  describe("/hello", function () {
    describe("GET", function () {
      it("should return a Hello World! message", async function () {
        const reply = await axios.get("http://localhost:3000/hello");
        expect(reply.status).to.be.equal(200);
        expect(reply.data.message).to.be.equal("Hello World!");
      });
    });
  });
  describe("/users", function () {
    describe("POST", function () {
      it("should create a new user", async function () {
        const body = {
          name: "mariana",
          email: "mari@gmail.com",
          password: "senha123",
          birthDate: "2004-10-10",
        };
        const reply = await axios.post("http://localhost:3000/users", body);

        const user = await prisma.user.findUnique({
          where: { email: body.email },
        });

        expect(reply.status).to.be.equal(201);

        expect(reply.data).to.be.deep.equal({
          id: user.id,
          name: "mariana",
          email: "mari@gmail.com",
          birthdate: new Date(body.birthDate).toISOString(),
        });

        expect(user).to.be.deep.equal({
          name: "mariana",
          email: "mari@gmail.com",
          birthDate: new Date(body.birthDate),
        });

        expect(reply.data.id).to.be.gt(0);

        const isPasswordCorrect = await compare(body.password, user.password);
        expect(isPasswordCorrect).to.be.true;

        await prisma.user.deleteMany();
      });
    });
  });
});
