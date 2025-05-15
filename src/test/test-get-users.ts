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
  it("should return a list of users with default limit when passing a limit that is not a number", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const reply = await axios.get("http://localhost:3000/users?limit=abc", {
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
  it("should return an error when passing a negative limit", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const reply = await axios.get("http://localhost:3000/users?limit=-5", {
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
});
