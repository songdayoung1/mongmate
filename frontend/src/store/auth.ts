import { create } from "zustand";
import { tokenStorage } from "../lib/tokenStorage";
import { login as loginApi } from "../api/auth";

// 프로젝트 곳곳에서 참조하는 AuthState API를 맞추면서,
// 토큰은 web=localStorage / native=SecureStore(키체인/키스토어)에 저장합니다.

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

  // ✅ 기존 화면 코드 호환용
  setSession: (session: Session) => Promise<void>;
  loginWithTokens: (session: Session) => Promise<void>;

  // PhoneNumberScreen 등 레거시 흐름 호환
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
  },

  setTokens: async (accessToken: string, refreshToken?: string) => {
    await tokenStorage.setAccessToken(accessToken);
    if (refreshToken) await tokenStorage.setRefreshToken(refreshToken);

    set({
      accessToken,
      refreshToken: refreshToken ?? get().refreshToken,
      isAuthed: true,
    });
  },

  setSession: async (session: Session) => {
    // 화면 코드에서 setSession 후 setTokens를 따로 호출하는 케이스가 있어도 안전하도록
    // 여기서도 토큰 저장/상태 갱신을 같이 처리합니다.
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
  },

  loginWithTokens: async (session: Session) => {
    await get().setSession(session);
  },

  login: async (phoneNumber: string) => {
    // 레거시 흐름: 서버 로그인 후 토큰 저장
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
