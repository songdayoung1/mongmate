import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

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

// ✅ 연결 상태를 외부에서도 안정적으로 판단하기 위해
export function isChatConnected() {
  return !!client?.connected;
}

export function ensureChatSocket(token: string, onConnected?: () => void) {
  if (!token) throw new Error("채팅 연결 실패: accessToken이 비어있습니다.");

  // 토큰이 바뀌었으면 기존 연결 끊고 재연결
  const tokenChanged = token !== currentToken;

  if (client?.connected && !tokenChanged) return client;

  if (client && tokenChanged) {
    try {
      client.deactivate();
    } catch {}
    client = null;
  }

  currentToken = token;

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 3000,
    debug: () => {},

    // ✅ CONNECT 프레임에만 실려도 백엔드가 세션에 저장함
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
  onMessage: (m: IncomingChatMessage) => void
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

    // ✅ 서버가 혹시 SEND에서도 Principal 확인/재검증하는 로직이 남아있을 때를 대비(안전장치)
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
  });
}
