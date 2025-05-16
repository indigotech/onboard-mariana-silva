import { expect } from "chai";
import jwt from "jsonwebtoken";
import "mocha";
import utils, { configRequestToken, createUser } from "./test-utils";

const test_data = {
  name: "mariana",
  email: "mari@gmail.com",
  password: "senha123",
  birthDate: "2004-10-10",
  addresses: [
    {
      CEP: "12345-678",
      street: "Main St",
      number: 54,
      complement: "Apto 4B",
      neighborhood: "Bairro",
      city: "São Paulo",
      state: "Minas Gerais",
    },
  ],
};

const { testAxios: axios, validToken } = utils;

describe("GET /users/:id", function () {
  it("should return the user data requested with their addresses swhen the id is registered and the user is authenticated", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const user = await createUser(test_data);

    const reply = await axios.get(
      `http://localhost:3000/users/${user?.id}`,
      configRequestToken(validToken)
    );

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      id: user?.id,
      name: test_data.name,
      email: test_data.email,
      birthDate: new Date(test_data.birthDate).toISOString(),
      addresses: test_data.addresses.map((address, idx) => ({
        CEP: address.CEP,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        state: address.state,
        city: address.city,
        id: user.addresses[idx].id,
        userID: user.addresses[idx].userID,
      })),
    });
  });

  it("should return no addresses if the user has not registered any and if the request is authenticated", async function () {
    const payload = { id: 1 };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);
    const user = await createUser({
      name: test_data.name,
      email: test_data.email,
      password: test_data.password,
      birthDate: test_data.birthDate,
    });

    const reply = await axios.get(`http://localhost:3000/users/${user?.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(reply.status).to.be.equal(200);
    expect(reply.data).to.be.deep.equal({
      id: user?.id,
      name: test_data.name,
      email: test_data.email,
      birthDate: new Date(test_data.birthDate).toISOString(),
      addresses: [],
    });
  });

  it("should return an error if the id is not a number", async function () {
    const reply = await axios.get(
      "http://localhost:3000/users/abc",
      configRequestToken(validToken)
    );

    expect(reply.status).to.be.equal(400);
    expect(reply.data).to.be.deep.equal({
      message: "Invalid ID. User ID must be a positive number",
      code: "USR_02",
      details: "The user ID must be a positive integer",
    });
  });

  it("should return an error if the id is not found", async function () {
    const reply = await axios.get(
      "http://localhost:3000/users/1",
      configRequestToken(validToken)
    );

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

    const response = await axios.get(
      "http://localhost:3000/users/3",
      configRequestToken(token)
    );

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

    const response = await axios.get(
      "http://localhost:3000/users/4",
      configRequestToken(token)
    );

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

    const response = await axios.get(
      "http://localhost:3000/users/5",
      configRequestToken(token)
    );

    expect(response.status).to.be.equal(401);
    expect(response.data).to.be.deep.equal({
      message: "Authentication failed. Try logging in once again",
      code: "AUT_02",
      details:
        "Decoded Payload from authentication token did not match the expected.",
    });
  });
});
