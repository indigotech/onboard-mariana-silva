export const PostUserBodySchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        id: {
          type: "number",
        },
        name: {
          type: "string",
        },
        email: {
          type: "string",
        },
        password: {
          type: "string",
          minLength: 6,
          pattern: "(?=.*[A-Za-z])(?=.*\\d)",
        },
        birthDate: {
          type: "string",
        },
      },
      required: ["name", "email", "password", "birthDate"],
    },
  },
};

export const PostAuthBodySchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        email: {
          type: "string",
        },
        password: {
          type: "string",
        },
        rememberMe: {
          type: "boolean",
        },
      },
      required: ["email", "password"],
    },
  },
};

export interface PostUserRequestBody {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}

export interface GetUserRequestBody {
  email: string;
  password: string;
  rememberMe: boolean;
}
