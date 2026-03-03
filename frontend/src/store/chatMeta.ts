import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatRoomPostSummary } from "../navigation/ChatStackNavigator";
import { persistStorage } from "./persisStorage";

type ChatMetaStore = {
  roomMeta: Record<string, ChatRoomPostSummary>;
  saveMeta: (roomId: string, meta?: ChatRoomPostSummary | null) => void;
  getMeta: (roomId: string) => ChatRoomPostSummary | undefined;
  clear: () => void;
};

export const useChatMetaStore = create<ChatMetaStore>()(
  persist(
    (set, get) => ({
      roomMeta: {},
      saveMeta: (roomId, meta) => {
        if (!roomId || !meta || !meta.postId) return;

        set((state) => ({
          roomMeta: {
            ...state.roomMeta,
            [roomId]: {
              ...state.roomMeta[roomId],
              ...meta,
              postId: meta.postId,
            },
          },
        }));
      },
      getMeta: (roomId) => get().roomMeta[roomId],
      clear: () => set({ roomMeta: {} }),
    }),
    {
      name: "chat-room-meta",
      getStorage: () => persistStorage,
    },
  ),
);
