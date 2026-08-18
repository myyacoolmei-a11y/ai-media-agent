import { metaGraphBase } from "@/lib/social/config";

type GraphError = {
  error?: { message?: string; type?: string; code?: number };
};

export async function metaRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit & { search?: Record<string, string> },
): Promise<T> {
  const url = new URL(`${metaGraphBase()}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("access_token", accessToken);
  const search = init?.search ?? {};
  for (const [key, value] of Object.entries(search)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: init?.method,
    headers: init?.headers,
    body: init?.body,
    cache: init?.cache ?? "no-store",
  });
  const body = (await response.json()) as T & GraphError;
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || `Meta API ${response.status}`);
  }
  return body;
}
