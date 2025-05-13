const UserRequestBodySchema = {
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

const AuthRequestBodySchema = {
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
      },
      required: ["email", "password"],
    },
  },
};

interface RequestBody {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}

export { AuthRequestBodySchema, RequestBody, UserRequestBodySchema };
