/** An error response from our API, with the server's message (written for people) and body. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: Record<string, unknown> | null,
  ) {
    super(message);
  }
}

export async function request<T>(path: string, init?: { method?: 'GET' | 'POST'; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? 'GET',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that it is running, then try again.", null);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = typeof body?.message === 'string' ? body.message : `Something went wrong (${res.status}).`;
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}
