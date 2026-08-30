export async function apiClient(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: options.cache ?? "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      typeof data === "object" && data?.message
        ? data.message
        : "حدث خطأ غير متوقع";
    throw new Error(message);
  }

  return data;
}


