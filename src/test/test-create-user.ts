import { compare } from "bcrypt-ts";
import { expect } from "chai";
import "mocha";
import { start, stop } from "../setup";
import { prisma } from "../setup-db";
import axios from "./axios-for-test";

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

describe("POST /users", function () {
  it("should create a new user and return credentials + id, except from the password", async function () {
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

    expect(user).to.deep.include({
      name: "mariana",
      email: "mari@gmail.com",
      birthDate: new Date(body.birthDate),
    });

    expect(reply.data.id).to.be.gt(0);

    const isPasswordCorrect = await compare(body.password, user.password);
    expect(isPasswordCorrect).to.be.true;
  });
  it("should return an error if the email already exists", async function () {
    const body = {
      name: "mariana",
      email: "mari@gmail.com",
      password: "senha123",
      birthDate: new Date("2004-10-10"),
    };
    await prisma.user.create({ data: body });

    const response = await axios.post("http://localhost:3000/users", body);
    expect(response.status).to.be.equal(400);
    expect(response.data).to.be.deep.equal({
      message: "The provided email address is already in use.",
      code: "EML_01",
      details: "Unique constraint failed on the fields: (`email`)",
    });
  });
  it("should return an error if the password has less than 6 characters", async function () {
    const body = {
      name: "mariana",
      email: "mari@gmail.com",
      password: "a",
      birthDate: "2004-10-10",
    };
    const response = await axios.post("http://localhost:3000/users", body);
    expect(response.status).to.be.equal(400);
    expect(response.data).to.be.deep.equal({
      message: "Password must be at least 6 characters long.",
      code: "PSW_01",
      details: "must NOT have fewer than 6 characters",
    });
  });
  it("should return an error if the password has not letter or digits", async function () {
    const body = {
      name: "mariana",
      email: "mari@gmail.com",
      password: "aaaaaaaaaa",
      birthDate: "2004-10-10",
    };
    const response = await axios.post("http://localhost:3000/users", body);
    expect(response.status).to.be.equal(400);
    expect(response.data).to.be.deep.equal({
      message: "Password must contain at least one letter and one number.",
      code: "PSW_02",
      details: 'must match pattern "(?=.*[A-Za-z])(?=.*\\d)"',
    });
  });
});
