import { Prisma } from "@prisma/client";
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

class CustomError extends Error {
  code: string;
  details: string | undefined;
  constructor(message: string, code: string, details?: string) {
    super(message);
    this.name = "CustomError";
    this.code = code;
    this.details = details;
  }
}

const errorStatusCodes: Record<string, number> = {
  EML_02: 400,
  PSW_03: 401,
};

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof CustomError) {
    return reply.status(errorStatusCodes[error.code]).send({
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  if (error.validation && error.validation.length > 0) {
    for (const validationError of error.validation) {
      const { instancePath, keyword, message } = validationError;

      if (instancePath === "/password" && keyword === "minLength") {
        return reply.status(400).send({
          message: "Password must be at least 6 characters long.",
          code: "PSW_01",
          details: message,
        });
      } else if (instancePath === "/password" && keyword === "pattern") {
        return reply.status(400).send({
          message: "Password must contain at least one letter and one number.",
          code: "PSW_02",
          details: message,
        });
      } else {
        return reply.status(400).send({
          message: "Invalid ceredentials.",
          code: "VAL_01",
          details: message,
        });
      }
    }
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target as string[] | undefined;
    if (target?.includes("email")) {
      return reply.status(400).send({
        message: "The provided email address is already in use.",
        code: "EML_01",
        details: "Unique constraint failed on the fields: (`email`)",
      });
    }
    return reply.status(500).send({
      message: "There was an error processing your request.",
      code: "UNK_01",
      details: error.message,
    });
  }
}

export { CustomError };
