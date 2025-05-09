import axios from "axios";
import { expect } from "chai";
import "mocha";
import { startServer, stopServer } from "../src/index";

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
});

describe("Server", function () {
  describe("/hello", function () {
    describe("GET", function () {
      it("should return a Hello World! message", async function () {
        const reply = await axios.get("http://localhost:3000/hello");
        expect(reply.status).to.be.equal(200);
        expect(reply.data.message).to.be.equal("Hello World!");
      });
    });
  });
});
