import { compare } from "bcrypt-ts";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import "mocha";
import { prisma } from "../setup-db";
import axios, { createUser } from "./test-utils";

const test_data = {
  name: "mariana",
  email: "mari@gmail.com",
  password: "senha123",
  birthDate: "2004-10-10",
};

afterEach(async () => {
  await prisma.user.deleteMany();
});

describe("POST /users", function () {
  it("should create a new user and return credentials + id, except from the password when user is authenticated", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);

    const reply = await axios.post("http://localhost:3000/users", test_data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const user = await prisma.user.findUnique({
      where: { email: test_data.email },
    });
    const isPasswordCorrect = await compare(test_data.password, user.password);

    expect(reply.status).to.be.equal(201);
    expect(reply.data).to.be.deep.equal({
      id: user.id,
      name: "mariana",
      email: "mari@gmail.com",
      birthdate: new Date(test_data.birthDate).toISOString(),
    });
    expect(user).to.deep.include({
      name: "mariana",
      email: "mari@gmail.com",
      birthDate: new Date(test_data.birthDate),
    });
    expect(reply.data.id).to.be.gt(0);
    expect(isPasswordCorrect).to.be.true;
  });

  it("should return an error if the email already exists", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    await createUser(test_data);

    const reply = await axios.post("http://localhost:3000/users", test_data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(reply.status).to.be.equal(400);
    expect(reply.data).to.be.deep.equal({
      message: "The provided email address is already in use.",
      code: "EML_01",
      details: "Unique constraint failed on the fields: (`email`)",
    });
  });

  it("should return an error if the password has less than 6 characters", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const body = {
      name: test_data.name,
      email: test_data.email,
      password: "a",
      birthDate: test_data.birthDate,
    };

    const reply = await axios.post("http://localhost:3000/users", body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(reply.status).to.be.equal(400);
    expect(reply.data).to.be.deep.equal({
      message: "Password must be at least 6 characters long.",
      code: "PSW_01",
      details: "must NOT have fewer than 6 characters",
    });
  });
  it("should return an error if the password has not letter or digits", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const body = {
      name: test_data.name,
      email: test_data.email,
      password: "aaaaaaaaaa",
      birthDate: test_data.birthDate,
    };

    const reply = await axios.post("http://localhost:3000/users", body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(reply.status).to.be.equal(400);
    expect(reply.data).to.be.deep.equal({
      message: "Password must contain at least one letter and one number.",
      code: "PSW_02",
      details: 'must match pattern "(?=.*[A-Za-z])(?=.*\\d)"',
    });
  });

  it("should return an error if request has no authentication token", async function () {
    const reply = await axios.post("http://localhost:3000/users", test_data);

    expect(reply.status).to.be.equal(401);
    expect(reply.data).to.be.deep.equal({
      message: "Authentication failed. Log in, then try again",
      code: "AUT_01",
      details: "No authentication token of type Bearer was provided",
    });
  });

  it("should return an error if authentication token is invalid", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, "wrong_secret");

    const reply = await axios.post("http://localhost:3000/users", test_data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(reply.status).to.be.equal(401);
    expect(reply.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in again",
      code: "AUT_03",
      details: "invalid signature",
    });
  });

  it("should return an error if authentication token is expired", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: -1 });

    const reply = await axios.post("http://localhost:3000/users", test_data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(reply.status).to.be.equal(401);
    expect(reply.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in again",
      code: "AUT_04",
      details: "jwt expired",
    });
  });

  it("should return an error if authentication token has an invalid payload", async function () {
    const payload = { name: "mariana" };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);

    const reply = await axios.post("http://localhost:3000/users", test_data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(reply.status).to.be.equal(401);
    expect(reply.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in once again",
      code: "AUT_02",
      details:
        "Decoded Payload from authentication token did not match the expected.",
    });
  });
});
