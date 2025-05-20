import { getUserResolver } from "./resolver-get-user";
import { loginResolver } from "./resolver-login";

export const resolvers = {
  Query: {
    getUser: getUserResolver,
  },
  Mutation: {
    login: loginResolver,
  },
};
