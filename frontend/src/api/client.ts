import { Platform } from "react-native";
import { useAuthStore } from "../store/auth";
import { tokenStorage } from "../lib/tokenStorage";

const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // ✅ Store hydration 타이밍/초기 화면 진입 순서에 따라 accessToken이 아직 null일 수 있어
  // 요청 직전에 storage에서도 한 번 더 확인한다.
  let token = useAuthStore.getState().accessToken;
  if (!token) {
    token = (await tokenStorage.getAccessToken()) ?? null;

    // storage에는 있는데 store가 비어있다면 동기화
    if (token) {
      useAuthStore
        .getState()
        .setTokens(token)
        .catch(() => {});
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
