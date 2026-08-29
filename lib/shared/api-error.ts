import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    /** Optional hint (seconds) surfaced as a `Retry-After` header — used by rate limiting. */
    public retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    const headers: HeadersInit | undefined =
      error.retryAfterSeconds !== undefined
        ? { "Retry-After": String(Math.max(0, Math.ceil(error.retryAfterSeconds))) }
        : undefined;
    return Response.json({ error: error.message }, { status: error.status, headers });
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
