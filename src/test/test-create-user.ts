import axios from "axios";
import { compare } from "bcrypt-ts";
import { expect } from "chai";
import jwt from "jsonwebtoken";
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

describe("POST /users", function () {
  it("should create a new user and return credentials + id, except from the password when user is authenticated", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);

    const body = {
      name: "mariana",
      email: "mari@gmail.com",
      password: "senha123",
      birthDate: "2004-10-10",
    };

    const reply = await axios.post("http://localhost:3000/users", body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

    await prisma.user.deleteMany();
  });
  it("should return an error if the email already exists", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);

    const body = {
      name: "mariana",
      email: "mari@gmail.com",
      password: "senha123",
      birthDate: "2004-10-10",
    };
    const reply = await axios.post("http://localhost:3000/users", body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    try {
      const reply = await axios.post("http://localhost:3000/users", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      expect(error.response.status).to.be.equal(400);
      expect(error.response.data).to.be.deep.equal({
        message: "The provided email address is already in use.",
        code: "EML_01",
        details: "Unique constraint failed on the fields: (`email`)",
      });
    }
  });
  it("should return an error if the password has less than 6 characters", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const body = {
      name: "ricardo",
      email: "ricardo@gmail.com",
      password: "a",
      birthDate: "2004-10-10",
    };
    try {
      await axios.post("http://localhost:3000/users", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      expect(error.response.status).to.be.equal(400);
      expect(error.response.data).to.be.deep.equal({
        message: "Password must be at least 6 characters long.",
        code: "PSW_01",
        details: "must NOT have fewer than 6 characters",
      });
    }
  });
  it("should return an error if the password has not letter or digits", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const body = {
      name: "teresa",
      email: "teresa@gmail.com",
      password: "aaaaaaaaaa",
      birthDate: "2004-10-10",
    };

    try {
      await axios.post("http://localhost:3000/users", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      expect(error.response.status).to.be.equal(400);
      expect(error.response.data).to.be.deep.equal({
        message: "Password must contain at least one letter and one number.",
        code: "PSW_02",
        details: 'must match pattern "(?=.*[A-Za-z])(?=.*\\d)"',
      });
    }
  });
  it("should return an error if request has no authentication token", async function () {
    const body = {
      name: "tatiane",
      email: "tatiane@hotmail.com",
      password: "senha123",
      birthDate: "2004-10-10",
    };
    try {
      await axios.post("http://localhost:3000/users", body);
    } catch (error) {
      expect(error.response.status).to.be.equal(401);
      expect(error.response.data).to.be.deep.equal({
        message: "Authentication failed. Log in, then try again",
        code: "AUT_01",
        details: "No authentication token was provided",
      });
    }
  });
  it("should return an error if authentication token is invalid", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, "wrong_secret");
    const body = {
      name: "pedro",
      email: "pedro@hotmail.com",
      password: "senha123",
      birthDate: "2004-10-10",
    };
    try {
      await axios.post("http://localhost:3000/users", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      expect(error.response.status).to.be.equal(401);
      expect(error.response.data).to.be.deep.equal({
        message: "Authentication failed. Try logging in again",
        code: "AUT_03",
        details: "invalid signature",
      });
    }
  });
  it("should return an error if authentication token is expired", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: -1 });
    const body = {
      name: "laura",
      email: "laura@hotmail.com",
      password: "senha123",
      birthDate: "2004-10-10",
    };
    try {
      await axios.post("http://localhost:3000/users", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      expect(error.response.status).to.be.equal(401);
      expect(error.response.data).to.be.deep.equal({
        message: "Authentication failed. Try logging in again",
        code: "AUT_04",
        details: "jwt expired",
      });
    }
  });
  it("should return an error if authentication token has an invalid payload", async function () {
    const payload = { name: "mariana" };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const body = {
      name: "fabiana",
      email: "fabiana@gmail.com",
      password: "senha123",
      birthDate: "2004-10-10",
    };
    try {
      await axios.post("http://localhost:3000/users", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      expect(error.response.status).to.be.equal(401);
      expect(error.response.data).to.be.deep.equal({
        message: "Authentication failed. Try logging in once again",
        code: "AUT_02",
        details:
          "Decoded Payload from authentication token did not match the expected.",
      });
    }
  });
});
