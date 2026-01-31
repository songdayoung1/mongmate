import { apiFetch } from "./client";

export type ChatMessageDto = {
  roomId: string;
  seq: number;
  userId: string;
  content: string;
  timestamp: number;
};

export async function loadRecentMessages(roomId: string, limit = 50) {
  const safe = Math.max(1, Math.min(limit, 200));
  return apiFetch<ChatMessageDto[]>(
    `/api/chat/rooms/${roomId}/messages?limit=${safe}`,
    { method: "GET" },
  );
}
