import { apiFetch } from "./client";

export type ChatRoomListItemDto = {
  roomId: string;
  title?: string;
  currentSeq: number;
  lastReadSeq: number;
  unreadCount: number;
  lastMessage: null | {
    senderId: string;
    content: string;
    seq: number;
    sentAt: string;
  };
  updatedAt: string;
};

export type ChatRoomStateDto = {
  roomId: string;
  currentSeq: number;
  lastReadSeq: number;
  unreadCount: number;
};

export type ChatMessageDto = {
  roomId: string;
  seq: number;
  userId: string;
  content: string;
  timestamp: number;
};

export type ChatReadRequest = { lastReadSeq: number };
export type ChatReadResponse = {
  roomId: string;
  userId: string;
  lastReadSeq: number;
};

export async function loadChatRooms() {
  return apiFetch<ChatRoomListItemDto[]>("/api/chat/rooms", {
    method: "GET",
    auth: "required",
  });
}

export async function loadRoomState(roomId: string) {
  return apiFetch<ChatRoomStateDto>(`/api/chat/rooms/${roomId}/state`, {
    method: "GET",
    auth: "required",
  });
}

export async function markRoomRead(roomId: string, lastReadSeq: number) {
  return apiFetch<ChatReadResponse>(`/api/chat/rooms/${roomId}/read`, {
    method: "POST",
    auth: "required",
    body: JSON.stringify({ lastReadSeq } satisfies ChatReadRequest),
  });
}

export async function loadRecentMessages(roomId: string, limit = 50) {
  const safe = Math.max(1, Math.min(limit, 200));
  return apiFetch<ChatMessageDto[]>(
    `/api/chat/rooms/${roomId}/messages?limit=${safe}`,
    { method: "GET", auth: "required" },
  );
}
