import jwt from "jsonwebtoken";
import "mocha";
import { prisma } from "../setup-db";

import { expect } from "chai";
import { start, stop } from "../setup";
import axios from "./axios-for-test";

before(async () => {
  await start();
});

after(async () => {
  await prisma.user.deleteMany();
  await stop();
});

describe("GET /users", function () {
  it("should return a list of users when passing a number limit", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const reply = await axios.get("http://localhost:3000/users?limit=15", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const users = await prisma.user.findMany({
      take: 15,
      orderBy: {
        name: "asc",
      },
    });
    const formattedUsers = users.map((user) => ({
      ...user,
      birthDate: user.birthDate.toISOString(),
    }));
    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({ users: formattedUsers });
    expect(reply.data.users.length).to.be.equal(15);
  });
  it("should return an error when passing a limit that is not a non-negative number", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const reply = await axios.get("http://localhost:3000/users?limit=abc", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(reply.status).to.be.equal(400);
    expect(reply.data).to.be.deep.equal({
      message: "Invalid limit. Limit must be a non-negative number.",
      code: "USR_03",
      details: "The limit must be a non-negative integer",
    });
  });
  it("should return a list of users with default limit when not passing a limit", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const reply = await axios.get("http://localhost:3000/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const users = await prisma.user.findMany({
      take: 20,
      orderBy: {
        name: "asc",
      },
    });
    const formattedUsers = users.map((user) => ({
      ...user,
      birthDate: user.birthDate.toISOString(),
    }));
    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({ users: formattedUsers });
    expect(reply.data.users.length).to.be.equal(20);
  });

  it("should return an error if request has no authentication token", async function () {
    const reply = await axios.get("http://localhost:3000/users");
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
    const reply = await axios.get("http://localhost:3000/users", {
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
    const reply = await axios.get("http://localhost:3000/users", {
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
    const reply = await axios.get("http://localhost:3000/users", {
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
