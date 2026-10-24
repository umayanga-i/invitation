export function apiErrorResponse(route: string, error: unknown, message: string, status = 500): Response {
  console.error(`[api ${route}]`, error);
  return Response.json({ error: message }, { status });
}
