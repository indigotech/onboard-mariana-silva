export const UserRequestBodySchema = {
  schema: {
    body: {
      type: "object",
      properties: {
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

export interface RequestBody {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}
