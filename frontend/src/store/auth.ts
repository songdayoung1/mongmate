import { create } from "zustand";
import { tokenStorage } from "../lib/tokenStorage";
import { login as loginApi } from "../api/auth";
import { disconnectChatSocket, ensureChatSocket } from "../ws/chatClient";

export type User = {
  id?: number;
  phone?: string;
  name?: string;
  [k: string]: any;
};

export type Session = {
  userId?: number;
  phoneNumber?: string;
  accessToken: string;
  refreshToken?: string;
  me?: User;
};

export type AuthState = {
  hydrated: boolean;
  isAuthed: boolean;

  userId: number | null;
  phoneNumber: string | null;
  user: User | null;

  accessToken: string | null;
  refreshToken: string | null;

  init: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken?: string) => Promise<void>;
  setSession: (session: Session) => Promise<void>;
  login: (phoneNumber: string) => Promise<"login">;
  logout: () => Promise<void>;
};

function sanitizeToken(t: any): string | null {
  if (t == null) return null;
  const s = String(t).trim();
  if (!s) return null;
  if (s === "null" || s === "undefined") return null;
  if (s.toLowerCase().startsWith("bearer ")) return s.slice(7).trim() || null;
  return s;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  isAuthed: false,

  userId: null,
  phoneNumber: null,
  user: null,

  accessToken: null,
  refreshToken: null,

  init: async () => {
    const [rawAccess, rawRefresh, userId, phoneNumber] = await Promise.all([
      tokenStorage.getAccessToken(),
      tokenStorage.getRefreshToken(),
      tokenStorage.getUserId(),
      tokenStorage.getPhoneNumber(),
    ]);

    const accessToken = sanitizeToken(rawAccess);
    const refreshToken = sanitizeToken(rawRefresh);

    set({
      accessToken,
      refreshToken,
      isAuthed: !!accessToken,
      userId: userId ?? null,
      phoneNumber: phoneNumber ?? null,
      hydrated: true,
    });

    // ✅ 토큰 있을 때만 warm-up (없으면 STOMP 무한시도 방지)
    if (accessToken) {
      ensureChatSocket().catch(() => {});
    } else {
      // 혹시 남아있는 소켓이 있으면 정리
      disconnectChatSocket().catch(() => {});
    }
  },

  setTokens: async (accessToken: string, refreshToken?: string) => {
    const at = sanitizeToken(accessToken);
    const rt = sanitizeToken(refreshToken);

    if (!at) {
      // ✅ 빈 토큰이 들어오면 아예 로그아웃 상태로 정리
      await tokenStorage.clear();
      set({
        isAuthed: false,
        accessToken: null,
        refreshToken: null,
        userId: null,
        phoneNumber: null,
        user: null,
      });
      await disconnectChatSocket();
      return;
    }

    await tokenStorage.setAccessToken(at);
    if (rt) await tokenStorage.setRefreshToken(rt);

    set({
      accessToken: at,
      refreshToken: rt ?? get().refreshToken,
      isAuthed: true,
    });

    // ✅ 토큰이 유효할 때만 warm-up
    ensureChatSocket().catch(() => {});
  },

  setSession: async (session: Session) => {
    await get().setTokens(session.accessToken, session.refreshToken);

    if (session.userId != null)
      tokenStorage.setUserId(session.userId).catch(() => {});
    if (session.phoneNumber)
      tokenStorage.setPhoneNumber(session.phoneNumber).catch(() => {});

    set({
      userId: session.userId ?? get().userId,
      phoneNumber: session.phoneNumber ?? get().phoneNumber,
      user: session.me ?? get().user,
    });
  },

  login: async (phoneNumber: string) => {
    const res = await loginApi(phoneNumber);
    await get().setSession({
      userId: res.userId,
      phoneNumber,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });
    return "login";
  },

  logout: async () => {
    await disconnectChatSocket();
    await tokenStorage.clear();
    set({
      isAuthed: false,
      accessToken: null,
      refreshToken: null,
      userId: null,
      phoneNumber: null,
      user: null,
    });
  },
}));
