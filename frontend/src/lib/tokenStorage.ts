import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId";
const PHONE_NUMBER_KEY = "phoneNumber";

// web(localStorage) / native(SecureStore) 공용
export const tokenStorage = {
  async setAccessToken(token: string) {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getAccessToken() {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
      } catch {
        return null;
      }
    }
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async removeAccessToken() {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  },

  async setRefreshToken(token: string) {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken() {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
      } catch {
        return null;
      }
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async removeRefreshToken() {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },

  async setUserId(userId: number) {
    const v = String(userId);
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(USER_ID_KEY, v);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(USER_ID_KEY, v);
  },

  async getUserId() {
    const v =
      Platform.OS === "web"
        ? (() => {
            try {
              return localStorage.getItem(USER_ID_KEY);
            } catch {
              return null;
            }
          })()
        : await SecureStore.getItemAsync(USER_ID_KEY);

    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },

  async removeUserId() {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(USER_ID_KEY);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(USER_ID_KEY);
  },

  async setPhoneNumber(phoneNumber: string) {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(PHONE_NUMBER_KEY, phoneNumber);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(PHONE_NUMBER_KEY, phoneNumber);
  },

  async getPhoneNumber() {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(PHONE_NUMBER_KEY);
      } catch {
        return null;
      }
    }
    return await SecureStore.getItemAsync(PHONE_NUMBER_KEY);
  },

  async removePhoneNumber() {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(PHONE_NUMBER_KEY);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(PHONE_NUMBER_KEY);
  },

  async clear() {
    await Promise.all([
      this.removeAccessToken(),
      this.removeRefreshToken(),
      this.removeUserId(),
      this.removePhoneNumber(),
    ]);
  },
};
