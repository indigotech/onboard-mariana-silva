import fastify, { FastifyInstance } from "fastify";
import { errorHandler } from "./error-handler";
import { getUserRoute } from "./route-get-user";
import { listUsersRoute } from "./route-get-users";
import { postAuthRoute } from "./route-post-auth";
import { postUserRoute } from "./route-post-users";
import { PostAuthBodySchema, PostUserBodySchema } from "./schemas";

export function buildServer(): FastifyInstance {
  const app = fastify({});
  app.setErrorHandler(errorHandler);

  app.get("/hello", async () => {
    return { message: "Hello World!" };
  });

  app.post("/users", PostUserBodySchema, postUserRoute);

  app.post("/auth", PostAuthBodySchema, postAuthRoute);

  app.get("/users/:id", getUserRoute);

  app.get("/users", listUsersRoute);

  return app;
}
