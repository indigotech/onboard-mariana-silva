export const UserRequestBodySchema = {
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

export const AuthRequestBodySchema = {
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

export interface RequestBody {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}
