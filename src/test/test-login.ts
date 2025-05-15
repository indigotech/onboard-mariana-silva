import { hash } from "bcrypt-ts";
import { expect } from "chai";
import jwt from "jsonwebtoken";
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

const test_data = {
  name: "mariana",
  email: "mari@yahoo.com",
  password: "lalala3",
  birthDate: "2004-10-10",
};

async function createUser() {
  await prisma.user.create({
    data: {
      name: test_data.name,
      email: test_data.email,
      password: await hash(test_data.password, 8),
      birthDate: new Date(test_data.birthDate).toISOString(),
    },
  });
  const user = await prisma.user.findUnique({
    where: { email: test_data.email },
  });
  return user;
}

describe("POST /auth", function () {
  it(`should return a token valid for ${process.env.TOKEN_TIMEOUT} seconds when login is successful`, async function () {
    const user = await createUser();
    const body = {
      email: test_data.email,
      password: test_data.password,
    };

    const reply = await axios.post("http://localhost:3000/auth", body);
    const decoded = jwt.verify(reply.data.token, process.env.TOKEN_KEY);
    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      user: {
        id: user.id,
        name: test_data.name,
        email: test_data.email,
        birthDate: new Date(test_data.birthDate).toISOString(),
      },
      token: reply.data.token,
    });
    expect(decoded.id).to.be.equal(user.id);
    expect(decoded.exp - decoded.iat).to.be.equal(
      Number(process.env.TOKEN_TIMEOUT) ?? 30
    );
  });
  it("should return an error if the email is not registered", async function () {
    const body = {
      email: "mari@gmail.com",
      password: test_data.password,
    };

    const response = await axios.post("http://localhost:3000/auth", body);

    expect(response.status).to.be.equal(400);
    expect(response.data).to.be.deep.equal({
      message: "Email not registered on platform",
      code: "EML_02",
    });
  });
  it("should return an error if the password is incorrect", async function () {
    await createUser();
    const body = {
      email: test_data.email,
      password: "wrongpassword",
    };

    const response = await axios.post("http://localhost:3000/auth", body);

    expect(response.status).to.be.equal(400);
    expect(response.data).to.be.deep.equal({
      message: "Wrong password. Try again",
      code: "PSW_03",
    });
  });
});
