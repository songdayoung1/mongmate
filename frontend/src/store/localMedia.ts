import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "./persisStorage";

export const EMPTY_MEDIA: string[] = [];

type LocalMediaState = {
  profileAvatarUri: string | null;
  postMedia: Record<string, string[]>;
  setProfileAvatarUri: (uri: string | null) => void;
  setPostMedia: (postId: string, uris: string[]) => void;
  clearPostMedia: (postId: string) => void;
};

export const useLocalMediaStore = create<LocalMediaState>()(
  persist(
    (set, get) => ({
      profileAvatarUri: null,
      postMedia: {},
      setProfileAvatarUri: (uri) => set({ profileAvatarUri: uri }),
      setPostMedia: (postId, uris) =>
        set({
          postMedia: {
            ...get().postMedia,
            [String(postId)]: [...uris],
          },
        }),
      clearPostMedia: (postId) =>
        set((state) => {
          const clone = { ...state.postMedia };
          delete clone[String(postId)];
          return { postMedia: clone };
        }),
    }),
    {
      name: "local-media-store",
      storage: persistStorage,
    },
  ),
);
