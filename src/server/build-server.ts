import fastify, { FastifyInstance } from "fastify";
import fs from "fs";
import mercurius from "mercurius";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { prisma } from "../setup-db";
import { errorHandler } from "./error-handler";
import { resolvers } from "./resolvers-graphql";
import { getUserRoute } from "./route-get-user";
import { listUsersRoute } from "./route-get-users";
import { postAuthRoute } from "./route-post-auth";
import { postUserRoute } from "./route-post-users";
import { PostAuthBodySchema, PostUserBodySchema } from "./schemas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemaPath = path.join(__dirname, "../graphql/schema.graphql");

export function buildServer(): FastifyInstance {
  const app = fastify({ logger: true });
  app.setErrorHandler(errorHandler);

  const schema = fs.readFileSync(schemaPath, "utf-8");

  app.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
    context: (request, reply) => {
      return { prisma, request, reply };
    },
  });

  app.get("/hello", async () => {
    return { message: "Hello World!" };
  });

  app.post("/users", PostUserBodySchema, postUserRoute);

  app.post("/auth", PostAuthBodySchema, postAuthRoute);

  app.get("/users/:id", getUserRoute);

  app.get("/users", listUsersRoute);

  return app;
}
