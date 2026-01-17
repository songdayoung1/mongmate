// src/store/auth.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { persistStorage } from "./persisStorage";

const AUTH_KEY = "mongmate_auth_session";

export type AuthState = {
  hydrated: boolean;
  isAuthed: boolean;

  userId: number | null;
  phoneNumber: string | null;

  accessToken: string | null;
  refreshToken: string | null;

  setSession: (payload: {
    userId: number;
    phoneNumber: string;
    accessToken: string;
    refreshToken: string;
  }) => void;

  logout: () => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      isAuthed: false,

      userId: null,
      phoneNumber: null,

      accessToken: null,
      refreshToken: null,

      setHydrated: (v) => set({ hydrated: v }),

      setSession: ({ userId, phoneNumber, accessToken, refreshToken }) => {
        set({
          isAuthed: true,
          userId,
          phoneNumber,
          accessToken,
          refreshToken,
        });
      },

      logout: () => {
        set({
          isAuthed: false,
          userId: null,
          phoneNumber: null,
          accessToken: null,
          refreshToken: null,
        });
      },
    }),
    {
      name: AUTH_KEY,
      storage: createJSONStorage(() => persistStorage),

      // ✅ 새로고침/재실행 시 복원 완료 플래그
      onRehydrateStorage: () => (state, error) => {
        // 에러가 나도 앱이 멈추지 않게
        state?.setHydrated(true);
      },

      // ✅ 저장할 값만 저장 (hydrated 같은 건 저장 안 함)
      partialize: (s) => ({
        isAuthed: s.isAuthed,
        userId: s.userId,
        phoneNumber: s.phoneNumber,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
    }
  )
);
