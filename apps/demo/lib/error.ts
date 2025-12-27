export type HttpStatus = 400 | 401 | 403 | 404 | 429 | 500 | 503;

export type ErrorSource = "api" | "database" | "external" | "validation";

const DEFAULT_MESSAGES: Record<HttpStatus, string> = {
  400: "Invalid request",
  401: "Authentication required",
  403: "Access denied",
  404: "Resource not found",
  429: "Too many requests",
  500: "Internal server error",
  503: "Service unavailable",
};

const INTERNAL_SOURCES: ErrorSource[] = ["database", "external"];

export class AppError extends Error {
  constructor(
    public readonly source: ErrorSource,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AppError";
  }

  static database(message: string, cause?: unknown) {
    return new AppError("database", message, { cause });
  }

  static external(message: string, cause?: unknown) {
    return new AppError("external", message, { cause });
  }

  static validation(message: string) {
    return new AppError("validation", message);
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: HttpStatus,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(message ?? DEFAULT_MESSAGES[status], options);
    this.name = "ApiError";
  }

  toResponse(): Response {
    return Response.json({ error: this.message }, { status: this.status });
  }

  static unauthorized(message?: string) {
    return new ApiError(401, message);
  }

  static forbidden(message?: string) {
    return new ApiError(403, message);
  }

  static badRequest(message?: string) {
    return new ApiError(400, message);
  }

  static notFound(message?: string) {
    return new ApiError(404, message);
  }

  static rateLimit(message?: string) {
    return new ApiError(429, message);
  }

  static internal(message?: string, cause?: unknown) {
    return new ApiError(500, message, { cause });
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  if (error instanceof AppError) {
    const isInternal = INTERNAL_SOURCES.includes(error.source);

    if (isInternal) {
      console.error(`[${error.source}]`, error.message, error.cause ?? "");
      return ApiError.internal().toResponse();
    }

    return ApiError.badRequest(error.message).toResponse();
  }

  console.error("[unknown]", error);
  return ApiError.internal().toResponse();
}
