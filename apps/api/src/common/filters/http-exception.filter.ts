import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { GqlArgumentsHost, GqlContextType } from "@nestjs/graphql";

import type { Response } from "express";

interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // For GraphQL contexts, just rethrow - Apollo handles errors
    if (host.getType<GqlContextType>() === "graphql") {
      GqlArgumentsHost.create(host);
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Safety check - if no response object, rethrow
    if (!response || typeof response.status !== "function") {
      throw exception;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle 401 errors - don't expose details
      if (status === HttpStatus.UNAUTHORIZED) {
        errorResponse = {
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        };
      } else if (typeof exceptionResponse === "string") {
        errorResponse = {
          error: exceptionResponse,
          code: this.statusToCode(status),
        };
      } else if (typeof exceptionResponse === "object") {
        const resp = exceptionResponse as Record<string, unknown>;
        errorResponse = {
          error: (resp["message"] as string) || "An error occurred",
          code: (resp["error"] as string) || this.statusToCode(status),
          details: resp["details"] as Record<string, unknown> | undefined,
        };
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    response.status(status).json(errorResponse);
  }

  private statusToCode(status: number): string {
    const codes: Record<number, string> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE_ENTITY",
      429: "TOO_MANY_REQUESTS",
      500: "INTERNAL_ERROR",
    };
    return codes[status] || "ERROR";
  }
}
