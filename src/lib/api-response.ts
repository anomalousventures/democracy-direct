const JSON_HEADERS = { "Content-Type": "application/json" };

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

export function errorResponse(error: string, status: number): Response {
  return jsonResponse({ error }, status);
}

export function badRequest(error: string): Response {
  return errorResponse(error, 400);
}

export function unauthorized(error = "Authentication required"): Response {
  return errorResponse(error, 401);
}

export function forbidden(error = "Not authorized"): Response {
  return errorResponse(error, 403);
}

export function notFound(error = "Not found"): Response {
  return errorResponse(error, 404);
}

export function conflict(error: string): Response {
  return errorResponse(error, 409);
}

export function tooManyRequests(error = "Too many requests"): Response {
  return errorResponse(error, 429);
}

export function serverError(error = "Internal server error"): Response {
  return errorResponse(error, 500);
}

export function validationError(errors: Array<{ field: string; message: string }>): Response {
  return new Response(JSON.stringify({ error: "Validation failed", errors }), {
    status: 400,
    headers: JSON_HEADERS,
  });
}
