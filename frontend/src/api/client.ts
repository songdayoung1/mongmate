import { useAuthStore } from "../store/auth";

const BASE_URL = "http://localhost:8080";

type AuthMode = "auto" | "required" | "none";

type ApiFetchOptions = RequestInit & {
  auth?: AuthMode; // ✅ 기본 auto
  debug?: boolean; // ✅ true면 요청헤더 콘솔 출력
};

/**
 * ✅ Authorization 헤더가 "필요 없는" 공개 API 경로들
 * - prefix 매칭 (startsWith)
 * - 프로젝트 진행하면서 공개 API가 늘어나면 여기에 추가
 *
 * ⚠️ 주의:
 * - 여기 들어간 경로들은 auth="auto" 일 때도 토큰을 붙이지 않음
 * - auth="required"면 무조건 붙임(= 보호 API)
 */
const PUBLIC_PATH_PREFIXES: string[] = [
  // Auth
  "/api/auth/sms/send",
  "/api/auth/sms/verify",
  // Walk posts: token should be attached when available, so keep auto mode without prefix
];

function isPublicPath(path: string) {
  // absolute url이 들어오면 path만 뽑아서 판단
  const p = path.startsWith("http")
    ? (() => {
        try {
          return new URL(path).pathname;
        } catch {
          return path;
        }
      })()
    : path;

  return PUBLIC_PATH_PREFIXES.some((prefix) => p.startsWith(prefix));
}

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

  /**
   * ✅ 토큰 부착 규칙 (개선)
   * - auth=none: 절대 안 붙임
   * - auth=required: 토큰 반드시 붙임 (없으면 위에서 throw)
   * - auth=auto:
   *    - 공개 API(PUBLIC_PATH_PREFIXES)에 해당하면 토큰 안 붙임
   *    - 그 외는 토큰 있으면 붙임
   */
  if (auth === "required") {
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  } else if (auth === "auto") {
    const publicApi = isPublicPath(path);
    if (!publicApi && token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }
  // auth === "none" 은 아무것도 안 함

  if (debug) {
    console.log("[apiFetch]", rest.method ?? "GET", url);
    console.log("[apiFetch] auth mode:", auth, "public:", isPublicPath(path));
    console.log("[apiFetch] headers:", finalHeaders);
  }

  const res = await fetch(url, { ...rest, headers: finalHeaders });
  const data = await readBodySafe(res);
  if (res.status === 401) {
    // 토큰 만료/무효 → 세션 정리
    try {
      const { logout } = useAuthStore.getState();
      if (logout) await logout();
    } catch {}
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data.message || data.error)) ||
      `${res.status} ${res.statusText}`;

    throw new Error(typeof msg === "string" ? msg : "서버 요청 실패");
  }

  return data as T;
}
