import axios from "axios";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import "mocha";
import { promisify } from "util";
import { start, stop } from "../setup";
import { prisma } from "../setup-db";

const sleep = promisify(setTimeout);

before(async () => {
  await start();
});

after(async () => {
  await prisma.user.deleteMany();
  await stop();
});

describe("POST /auth", function () {
  it(`should return a token valid for ${process.env.TOKEN_TIMEOUT} seconds when login is successful`, async function () {
    this.timeout(35000);
    const test_data = {
      id: 1,
      name: "mariana",
      email: "mari@yahoo.com",
      password: "lalala3",
      birthDate: new Date("2004-10-10"),
    };
    await axios.post("http://localhost:3000/users", test_data);

    const body = {
      email: test_data.email,
      password: test_data.password,
    };

    const reply = await axios.post("http://localhost:3000/auth", body);
    const decoded = jwt.verify(reply.data.token, process.env.TOKEN_KEY);
    expect(reply.status).to.be.equal(200);
    expect(decoded.id).to.be.equal(test_data.id);

    await sleep(1000 * (Number(process.env.TOKEN_TIMEOUT) || 30));

    try {
      jwt.verify(reply.data.token, process.env.TOKEN_KEY);
      expect.fail(
        `Token should be expired after ${process.env.TOKEN_TIMEOUT} seconds`
      );
    } catch (error) {
      expect(error.name).to.be.equal("TokenExpiredError");
    }
  });
  it("should return an error if the email is not registered", async function () {
    const body = {
      email: "mari@gmail.com",
      password: "senha123",
    };
    try {
      await axios.post("http://localhost:3000/auth", body);
    } catch (error) {
      expect(error.response.status).to.be.equal(400);
      expect(error.response.data).to.be.deep.equal({
        message: "Email not registered on platform",
        code: "EML_02",
      });
    }
  });
  it("should return an error if the password is incorrect", async function () {
    const test_data = {
      id: 10,
      name: "beatriz",
      email: "bia@yahoo.com",
      password: "lalala3",
      birthDate: "2005-02-27",
    };

    await axios.post("http://localhost:3000/users", test_data);

    const body = {
      email: test_data.email,
      password: "wrongpassword",
    };

    try {
      await axios.post("http://localhost:3000/auth", body);
    } catch (error) {
      expect(error.response.status).to.be.equal(400);
      expect(error.response.data).to.be.deep.equal({
        message: "Wrong password. Try again",
        code: "PSW_03",
      });
    }
  });
  it("the token returned should be expired in 30 seconds", async function () {});
});
