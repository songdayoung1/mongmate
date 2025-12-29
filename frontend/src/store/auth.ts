// src/store/auth.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  }) => Promise<void>;

  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  isAuthed: false,

  userId: null,
  phoneNumber: null,

  accessToken: null,
  refreshToken: null,

  setSession: async ({ userId, phoneNumber, accessToken, refreshToken }) => {
    const session = { userId, phoneNumber, accessToken, refreshToken };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
    set({
      hydrated: true,
      isAuthed: true,
      userId,
      phoneNumber,
      accessToken,
      refreshToken,
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    set({
      isAuthed: false,
      userId: null,
      phoneNumber: null,
      accessToken: null,
      refreshToken: null,
    });
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      if (!raw) {
        set({ hydrated: true, isAuthed: false });
        return;
      }
      const session = JSON.parse(raw) as {
        userId: number;
        phoneNumber: string;
        accessToken: string;
        refreshToken: string;
      };

      set({
        hydrated: true,
        isAuthed: true,
        userId: session.userId,
        phoneNumber: session.phoneNumber,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    } catch {
      set({ hydrated: true, isAuthed: false });
    }
  },
}));
