import { useAuthStore } from "../store/auth";

const BASE_URL = "http://localhost:8080";

type AuthMode = "auto" | "required" | "none";

type ApiFetchOptions = RequestInit & {
  auth?: AuthMode; // ✅ 기본 auto
  debug?: boolean; // ✅ true면 요청헤더 콘솔 출력
};

async function readBodySafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const { auth = "auto", debug = false, headers, ...rest } = options;

  // ✅ store에서 토큰 가져오기 (필드명이 다르면 여기만 맞추면 됨)
  const token = useAuthStore.getState().accessToken;

  // ✅ auth=required 인데 토큰 없으면 여기서 끊기
  if (auth === "required" && !token) {
    throw new Error("로그인이 필요합니다. (accessToken 없음)");
  }

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as any),
  };

  // body가 있는 요청만 Content-Type 기본 부착
  // (GET에 Content-Type 붙여도 문제는 없지만 깔끔하게)
  const hasBody = !!rest.body;
  if (hasBody && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  // ✅ 토큰 부착 규칙:
  // - auth=none: 절대 안 붙임 (로그인/회원가입)
  // - auth=auto: 토큰 있으면 붙임
  // - auth=required: 토큰 반드시 붙임(위에서 없으면 에러)
  if (auth !== "none" && token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  if (debug) {
    console.log("[apiFetch]", rest.method ?? "GET", url);
    console.log("[apiFetch] headers:", finalHeaders);
  }

  const res = await fetch(url, { ...rest, headers: finalHeaders });
  const data = await readBodySafe(res);

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data.message || data.error)) ||
      `${res.status} ${res.statusText}`;

    throw new Error(typeof msg === "string" ? msg : "서버 요청 실패");
  }

  return data as T;
}
