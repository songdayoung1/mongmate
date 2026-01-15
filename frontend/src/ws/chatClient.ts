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

// ✅ 중요: 실기기/에뮬에서 localhost는 서버가 아님.
// 웹=localhost OK / 폰=PC IP로 바꿔야 함.
// const WS_URL = "http://192.168.0.10:8080/ws-chat";
const WS_URL = "http://localhost:8080/ws-chat";

let client: Client | null = null;

export function ensureChatSocket(onConnected?: () => void) {
  if (client?.connected) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 3000,
    debug: () => {},
  });

  client.onConnect = () => {
    onConnected?.();
  };

  client.onStompError = (frame) => {
    console.log("STOMP error:", frame.headers["message"], frame.body);
  };

  client.activate();
  return client;
}

export function subscribeRoom(
  roomId: string,
  onMessage: (m: IncomingChatMessage) => void
): StompSubscription {
  if (!client?.connected) {
    throw new Error("STOMP client is not connected");
  }

  return client.subscribe(`/topic/chat.room.${roomId}`, (msg: IMessage) => {
    try {
      onMessage(JSON.parse(msg.body));
    } catch {
      console.log("Invalid ws message:", msg.body);
    }
  });
}

export function publishChat(payload: SendChatPayload) {
  if (!client?.connected) {
    throw new Error("STOMP client is not connected");
  }

  client.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(payload),
  });
}
