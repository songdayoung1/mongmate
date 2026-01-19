// src/store/persistStorage.ts
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

type PersistStorage = {
  getItem: (name: string) => Promise<string | null> | string | null;
  setItem: (name: string, value: string) => Promise<void> | void;
  removeItem: (name: string) => Promise<void> | void;
};

const webStorage: PersistStorage = {
  getItem: (name) => {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(name);
    } catch {}
  },
};

const secureStorage: PersistStorage = {
  getItem: async (name) => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {}
  },
  removeItem: async (name) => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {}
  },
};

export const persistStorage: PersistStorage =
  Platform.OS === "web" ? webStorage : secureStorage;
