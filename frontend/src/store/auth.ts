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
  loginWithTokens: (session: Session) => Promise<void>;

  login: (phoneNumber: string) => Promise<"signup" | "login">;

  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  isAuthed: false,

  userId: null,
  phoneNumber: null,
  user: null,

  accessToken: null,
  refreshToken: null,

  init: async () => {
    const [accessToken, refreshToken, userId, phoneNumber] = await Promise.all([
      tokenStorage.getAccessToken(),
      tokenStorage.getRefreshToken(),
      tokenStorage.getUserId(),
      tokenStorage.getPhoneNumber(),
    ]);

    set({
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      isAuthed: !!accessToken,
      userId: userId ?? null,
      phoneNumber: phoneNumber ?? null,
      hydrated: true,
    });

    // ✅ 앱 재실행 후 토큰이 있다면 미리 소켓 warm-up (UX 개선)
    if (accessToken) {
      ensureChatSocket().catch(() => {});
    }
  },

  setTokens: async (accessToken: string, refreshToken?: string) => {
    await tokenStorage.setAccessToken(accessToken);
    if (refreshToken) await tokenStorage.setRefreshToken(refreshToken);

    set({
      accessToken,
      refreshToken: refreshToken ?? get().refreshToken,
      isAuthed: true,
    });

    // ✅ 토큰이 세팅되는 순간 소켓 미리 연결
    ensureChatSocket().catch(() => {});
  },

  setSession: async (session: Session) => {
    await get().setTokens(session.accessToken, session.refreshToken);

    if (session.userId != null) {
      tokenStorage.setUserId(session.userId).catch(() => {});
    }
    if (session.phoneNumber) {
      tokenStorage.setPhoneNumber(session.phoneNumber).catch(() => {});
    }

    set({
      userId: session.userId ?? get().userId,
      phoneNumber: session.phoneNumber ?? get().phoneNumber,
      user: session.me ?? get().user,
    });

    // ✅ 세션 확정 이후에도 한번 더 warm-up (안전)
    ensureChatSocket().catch(() => {});
  },

  loginWithTokens: async (session: Session) => {
    await get().setSession(session);
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
    try {
      await disconnectChatSocket();
    } catch {}

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
