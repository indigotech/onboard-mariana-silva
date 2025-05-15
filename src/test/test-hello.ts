import axios from "axios";
import { expect } from "chai";
import "mocha";

describe("GET /hello", function () {
  it("should return a Hello World! message", async function () {
    const reply = await axios.get("http://localhost:3000/hello");
    console.log("Starting GET /hello test...");

    expect(reply.status).to.be.equal(200);
    expect(reply.data.message).to.be.equal("Hello World!");
  });
});
