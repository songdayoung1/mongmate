import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { tokenStorage } from "../lib/tokenStorage";
import { useAuthStore } from "../store/auth";

export type IncomingChatMessage = {
  roomId: string;
  userId: string;
  content: string;
  timestamp: number;
};

export type SendChatPayload = {
  roomId: string;
  userId: string;
  content: string;
};

const WS_URL = "http://localhost:8080/ws-chat";

let client: Client | null = null;
let currentToken = "";

// ✅ 연결 상태
export function isChatConnected() {
  return !!client?.connected;
}

// ✅ 토큰을 내부에서 읽어서 연결
export async function ensureChatSocket(onConnected?: () => void) {
  // 1) store
  let token = useAuthStore.getState().accessToken;

  // 2) storage fallback
  if (!token) {
    token = (await tokenStorage.getAccessToken()) ?? null;

    // storage에 있으면 store도 동기화(선택)
    if (token) {
      useAuthStore
        .getState()
        .setTokens(token)
        .catch(() => {});
    }
  }

  if (!token) throw new Error("채팅 연결 실패: accessToken이 비어있습니다.");

  const tokenChanged = token !== currentToken;

  if (client?.connected && !tokenChanged) return client;

  if (client && tokenChanged) {
    try {
      await client.deactivate();
    } catch {}
    client = null;
  }

  currentToken = token;

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 3000,
    debug: () => {},

    // ✅ STOMP CONNECT 프레임에 토큰 전달
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  client.onConnect = () => {
    onConnected?.();
  };

  client.onStompError = (frame) => {
    console.log("STOMP error headers:", frame.headers);
    console.log("STOMP error body:", frame.body);
  };

  client.onWebSocketClose = (evt) => {
    console.log("WS close:", evt.code, evt.reason || "");
  };

  client.activate();
  return client;
}

export function subscribeRoom(
  roomId: string,
  onMessage: (m: IncomingChatMessage) => void,
): StompSubscription {
  if (!client) throw new Error("STOMP client is not initialized");
  if (!client.connected) throw new Error("STOMP client is not connected");

  return client.subscribe(`/topic/chat.room.${roomId}`, (msg: IMessage) => {
    try {
      onMessage(JSON.parse(msg.body));
    } catch {
      console.log("Invalid ws message:", msg.body);
    }
  });
}

export function publishChat(payload: SendChatPayload) {
  if (!client || !client.connected) {
    console.log("❌ STOMP not connected, skip send");
    return;
  }

  client.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(payload),
    headers: {
      // ✅ SEND에서도 대비
      Authorization: `Bearer ${currentToken}`,
    },
  });
}

// (선택) 화면 unmount 시 정리하고 싶으면
export async function disconnectChatSocket() {
  if (!client) return;
  try {
    await client.deactivate();
  } catch {}
  client = null;
  currentToken = "";
}
