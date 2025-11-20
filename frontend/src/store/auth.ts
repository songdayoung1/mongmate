import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "mongmate_auth"; // 현재 로그인 유저 정보
const REGISTERED_KEY = "mongmate_registered_phones"; // 가입한 적 있는 폰번호 리스트

type AuthUser = {
  phone: string;
};

type LoginMode = "signup" | "login";

type AuthState = {
  isAuthed: boolean;
  user: AuthUser | null;

  // phone을 넣으면 "signup"인지 "login"인지 알려줌
  login: (phone: string) => Promise<LoginMode>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthed: false,
  user: null,

  login: async (phone: string) => {
    // 1) 이미 가입된 번호 리스트 가져오기
    const raw = await AsyncStorage.getItem(REGISTERED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];

    const exists = list.includes(phone);
    let mode: LoginMode;

    if (exists) {
      // 기존 회원 → 로그인 모드
      mode = "login";
    } else {
      // 신규 번호 → 리스트에 추가 = 회원가입
      list.push(phone);
      await AsyncStorage.setItem(REGISTERED_KEY, JSON.stringify(list));
      mode = "signup";
    }

    // 2) 현재 로그인 유저로 저장
    const user: AuthUser = { phone };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    set({ isAuthed: true, user });

    return mode;
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    set({ isAuthed: false, user: null });
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      if (!raw) {
        set({ isAuthed: false, user: null });
        return;
      }
      const user = JSON.parse(raw) as AuthUser;
      set({ isAuthed: true, user });
    } catch (e) {
      set({ isAuthed: false, user: null });
    }
  },
}));
