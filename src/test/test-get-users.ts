import { expect } from "chai";
import jwt from "jsonwebtoken";
import "mocha";
import { prisma } from "../setup-db";

import utils, { configRequestToken } from "./test-utils";

const { testAxios: axios, validToken } = utils;

function config(token: string) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

const validToken = jwt.sign({ id: 1 }, process.env.TOKEN_KEY);

async function getUsersList(take: number = 20, offset: number = 0) {
  const users = await prisma.user.findMany({
    take,
    skip: offset,
    orderBy: {
      name: "asc",
    },
    include: {
      addresses: true,
    },
  });
  const formattedUsers = users.map(({ password, ...user }) => ({
    ...user,
    birthDate: user.birthDate.toISOString(),
  }));
  return formattedUsers;
}

describe("GET /users", function () {
  it("should return a paginated list of users with specified limit and offset", async function () {
    const take = 15;
    const offset = 5;
    const users = await getUsersList(take, offset);
    const total = await prisma.user.count();

    const reply = await axios.get(
      `http://localhost:3000/users?limit=${take}&offset=${offset}`,
      config(validToken)
    );

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      users: users,
      total: total,
      offset: offset,
      hasPreviousPage: true,
      hasNextPage: true,
    });
    expect(reply.data.users.length).to.be.equal(take);
  });

  it("should return the first set of users with specified limit and no offset", async function () {
    const take = 15;
    const users = await getUsersList(take);
    const total = await prisma.user.count();

    const reply = await axios.get(
      `http://localhost:3000/users?limit=${take}`,
      config(validToken)
    );

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      users: users,
      total: total,
      offset: 0,
      hasPreviousPage: false,
      hasNextPage: true,
    });
    expect(reply.data.users.length).to.be.equal(take);
  });

  it("should return a paginated list starting from the specified offset with the default limit", async function () {
    const offset = 5;
    const users = await getUsersList(20, offset);
    const total = await prisma.user.count();

    const reply = await axios.get(
      `http://localhost:3000/users?offset=${offset}`,
      config(validToken)
    );

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      users: users,
      total: total,
      offset: offset,
      hasPreviousPage: true,
      hasNextPage: true,
    });
    expect(reply.data.users.length).to.be.equal(20);
  });

  it("should return the first set of users with the default limit when no limit or offset is provided", async function () {
    const users = await getUsersList();
    const total = await prisma.user.count();

    const reply = await axios.get(
      "http://localhost:3000/users",
      configRequestToken(validToken)
    );

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      users: users,
      total: total,
      offset: 0,
      hasPreviousPage: false,
      hasNextPage: true,
    });
    expect(reply.data.users.length).to.be.equal(20);
  });

  it("should return hasNext as false when returning the last users", async function () {
    const take = 1;
    const offset = 49;
    const users = await getUsersList(take, offset);
    const total = await prisma.user.count();

    const reply = await axios.get(
      `http://localhost:3000/users?limit=${take}&offset=${offset}`,
      config(validToken)
    );
    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      users: users,
      total: total,
      offset: offset,
      hasPreviousPage: true,
      hasNextPage: false,
    });
    expect(reply.data.users.length).to.be.equal(take);
  });

  it("should return an empty list when passing an offset that is greater than the total of users", async function () {
    const total = await prisma.user.count();

    const reply = await axios.get(
      "http://localhost:3000/users?offset=1000",
      config(validToken)
    );

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      users: [],
      total: total,
      offset: 1000,
      hasPreviousPage: true,
      hasNextPage: false,
    });
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
