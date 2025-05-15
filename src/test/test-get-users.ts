import jwt from "jsonwebtoken";
import "mocha";
import { prisma } from "../setup-db";

import { expect } from "chai";
import { start, stop } from "../setup";
import utils, { configRequestToken } from "./test-utils";

const { testAxios: axios, validToken } = utils;

before(async () => {
  await start();
});

after(async () => {
  await prisma.user.deleteMany();
  await stop();
});

async function getUsersList(take: number) {
  const users = await prisma.user.findMany({
    take,
    orderBy: {
      name: "asc",
    },
  });
  const formattedUsers = users.map(({ password, ...user }, idx) => ({
    ...user,
    birthDate: user.birthDate.toISOString(),
  }));
  return formattedUsers;
}

describe("GET /users", function () {
  it("should return a list of the first users with specific length when passing a number limit and no offset", async function () {
    const take = 15;
    const users = await getUsersList(take);
    const total = await prisma.user.count();

    const reply = await axios.get(
      `http://localhost:3000/users?limit=${take}`,
      configRequestToken(validToken)
    );

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      users: users,
      total: total,
      offset: 0,
      hasUsersBefore: false,
      hasUsersAfter: take < total,
    });
    expect(reply.data.users.length).to.be.equal(take);
  });

  it("should return a list of users with specific length and an offset when passing a number offset and a number limit", async function () {
    const take = 15;
    const offset = 5;
    const token = jwt.sign({ id: 1 }, process.env.TOKEN_KEY);
    const users = await getUsersList(take);
    const total = await prisma.user.count();

    const reply = await axios.get(
      `http://localhost:3000/users?limit=${take}&offset=${offset}`,
      config(token)
    );

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      users: users,
      total: total,
      offset: offset,
      hasUsersBefore: offset > 0,
      hasUsersAfter: offset + take < total,
    });
    expect(reply.data.users.length).to.be.equal(take);
  });

  it("should return a list of users with default limit when not passing a limit", async function () {
    const users = await getUsersList(20);

    const reply = await axios.get(
      "http://localhost:3000/users",
      configRequestToken(validToken)
    );

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({ users: users });
    expect(reply.data.users.length).to.be.equal(20);
  });

  it("should return an error when passing a limit that is not a non-negative number", async function () {
    const reply = await axios.get(
      "http://localhost:3000/users?limit=abc",
      configRequestToken(validToken)
    );

    expect(reply.status).to.be.equal(400);
    expect(reply.data).to.be.deep.equal({
      message: "Invalid limit. Limit must be a non-negative number.",
      code: "USR_03",
      details: "The limit must be a non-negative integer",
    });
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
    const token = jwt.sign({ id: 1 }, "wrong_secret");

    const reply = await axios.get(
      "http://localhost:3000/users",
      configRequestToken(token)
    );

    expect(reply.status).to.be.equal(401);
    expect(reply.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in again",
      code: "AUT_03",
      details: "invalid signature",
    });
  });

  it("should return an error if authentication token is expired", async function () {
    const token = jwt.sign({ id: 1 }, process.env.TOKEN_KEY, { expiresIn: -1 });

    const reply = await axios.get(
      "http://localhost:3000/users",
      configRequestToken(token)
    );

    expect(reply.status).to.be.equal(401);
    expect(reply.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in again",
      code: "AUT_04",
      details: "jwt expired",
    });
  });

  it("should return an error if authentication token has an invalid payload", async function () {
    const token = jwt.sign({ name: "mariana" }, process.env.TOKEN_KEY);

    const reply = await axios.get(
      "http://localhost:3000/users",
      configRequestToken(token)
    );

    expect(reply.status).to.be.equal(401);
    expect(reply.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in once again",
      code: "AUT_02",
      details:
        "Decoded Payload from authentication token did not match the expected.",
    });
  });
});
