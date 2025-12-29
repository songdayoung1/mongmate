import { Platform } from "react-native";

const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  console.log("🔥 SEND URL", `${API_BASE_URL}/api/auth/sms/send`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return undefined as T;

  return (await res.json()) as T;
}
