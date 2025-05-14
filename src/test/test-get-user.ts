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

describe("GET /users/:id", function () {
  it("should return data requested when the id is registered and the user is authenticated", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const body = {
      name: "mariana",
      email: "mari@gmail.com",
      password: "senha123",
      birthDate: "2004-10-10",
    };
    await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: await hash(body.password, 8),
        birthDate: new Date(body.birthDate),
      },
    });
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    const reply = await axios.get(`http://localhost:3000/users/${user?.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      id: user?.id,
      name: body.name,
      email: body.email,
      birthDate: new Date(body.birthDate).toISOString(),
    });
  });
  it("should return an error if the id is not a number", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const reply = await axios.get("http://localhost:3000/users/abc", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(reply.status).to.be.equal(400);
    expect(reply.data).to.be.deep.equal({
      message: "Invalid ID. User ID must be a number",
      code: "USR_02",
      details: "The user ID must be an integer",
    });
  });
  it("should return an error if the id is not found", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const reply = await axios.get("http://localhost:3000/users/1", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(reply.status).to.be.equal(404);
    expect(reply.data).to.be.deep.equal({
      message: "User not found",
      code: "USR_01",
      details: "User id was not found on the database",
    });
  });
  it("should return an error if request has no authentication token", async function () {
    const response = await axios.get("http://localhost:3000/users/2");
    expect(response.status).to.be.equal(401);
    expect(response.data).to.be.deep.equal({
      message: "Authentication failed. Log in, then try again",
      code: "AUT_01",
      details: "No authentication token of type Bearer was provided",
    });
  });
  it("should return an error if authentication token is invalid", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, "wrong_secret");
    const response = await axios.get("http://localhost:3000/users/3", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(response.status).to.be.equal(401);
    expect(response.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in again",
      code: "AUT_03",
      details: "invalid signature",
    });
  });
  it("should return an error if authentication token is expired", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: -1 });
    const response = await axios.get("http://localhost:3000/users/4", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(response.status).to.be.equal(401);
    expect(response.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in again",
      code: "AUT_04",
      details: "jwt expired",
    });
  });
  it("should return an error if authentication token has an invalid payload", async function () {
    const payload = { name: "mariana" };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const response = await axios.get("http://localhost:3000/users/5", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(response.status).to.be.equal(401);
    expect(response.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in once again",
      code: "AUT_02",
      details:
        "Decoded Payload from authentication token did not match the expected.",
    });
  });
});
