import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { tokenStorage } from "../lib/tokenStorage";
import { refreshTokens } from "../api/auth";
import { useAuthStore } from "../store/auth";

const WS_URL = "http://localhost:8080/ws-chat";

let client: Client | null = null;
let connectingPromise: Promise<Client> | null = null;
let lastToken: string | null = null;
let suspendReconnectUntil: number | null = null;
let refreshPromise: Promise<string | null> | null = null;

export type SendChatPayload = {
  roomId: string;
  content: string;
};

export type IncomingChatMessage = {
  roomId: string;
  seq: number;
  userId: string;
  content: string;
  timestamp: number; // or sentAt 형태면 프론트에서 보정
};

function debugLog(msg: string, ...args: any[]) {
  console.log("[chatClient]", msg, ...args);
}

function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("utf-8");
    const data = JSON.parse(json);
    return typeof data.exp === "number" ? data.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function ensureFreshAccessToken(rawToken: string): Promise<string> {
  const expMs = decodeJwtExp(rawToken);
  const now = Date.now();
  const shouldRefresh = expMs !== null && expMs <= now + 30_000; // 30s 여유

  if (!shouldRefresh) return rawToken;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const rt = await tokenStorage.getRefreshToken();
      if (!rt) return null;
      try {
        const refreshed = await refreshTokens(rt);
        const { setSession } = useAuthStore.getState();
        await setSession({
          userId: refreshed.userId,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        });
        return refreshed.accessToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  const newToken = await refreshPromise;
  if (newToken) return newToken;

  // ✅ refresh 실패 + 만료 임박/만료 토큰이면 연결 차단
  suspendReconnectUntil = Date.now() + 5 * 60 * 1000; // 5분
  try {
    const { logout } = useAuthStore.getState();
    await logout?.();
  } catch {}
  throw new Error("accessToken expired and refresh failed");
}

export async function ensureChatSocket(): Promise<Client> {
  if (suspendReconnectUntil && Date.now() < suspendReconnectUntil) {
    throw new Error("STOMP reconnect suspended (expired token)");
  }

  const rawAccessToken = await tokenStorage.getAccessToken();
  if (!rawAccessToken) throw new Error("accessToken이 비어있습니다.");

  const accessToken = await ensureFreshAccessToken(rawAccessToken);
  if (!accessToken) throw new Error("accessToken이 비어있습니다.");

  // ✅ 토큰이 바뀌면 기존 소켓 정리 후 재생성
  if (lastToken && lastToken !== accessToken) {
    await disconnectChatSocket();
  }

  if (client && client.connected) return client;
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    const c = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      debug: (str) => console.log("[STOMP]", str),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    // ✅ 재연결 시마다 최신 토큰으로 CONNECT 헤더 갱신
    c.beforeConnect = async () => {
      const tokenRaw = await tokenStorage.getAccessToken();
      if (!tokenRaw) throw new Error("accessToken이 비어있습니다.");
      const token = await ensureFreshAccessToken(tokenRaw);
      if (!token) throw new Error("accessToken이 비어있습니다.");
      c.connectHeaders = { Authorization: `Bearer ${token}` };
    };

    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const fail = (err: Error) => {
          if (settled) return;
          settled = true;
          reject(err);
        };

        c.onConnect = () => {
          if (settled) return;
          settled = true;
          debugLog("✅ STOMP connected:", WS_URL);
          resolve();
        };
        c.onStompError = async (frame) => {
          console.error("[STOMP] stomp error", frame.headers, frame.body);

          const body = frame.body || "";
          if (body.includes("Expired JWT") || body.includes("ExpiredJwt")) {
            try {
              const rt = await tokenStorage.getRefreshToken();
              if (!rt) throw new Error("refreshToken이 비어있습니다.");

              const refreshed = await refreshTokens(rt);
              const { setSession } = useAuthStore.getState();
              await setSession({
                userId: refreshed.userId,
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
              });

              await disconnectChatSocket();
              await ensureChatSocket();
              return;
            } catch (e) {
              // ✅ refresh 실패 시 재연결 루프 중단 + 로그아웃 유도
              suspendReconnectUntil = Date.now() + 5 * 60 * 1000; // 5분
              try {
                const { logout } = useAuthStore.getState();
                await logout?.();
              } catch {}
              fail(new Error("STOMP expired + refresh failed"));
              return;
            }
          }

          fail(new Error(frame.body || "STOMP error"));
        };
        c.onWebSocketError = (e) => {
          console.error("[STOMP] websocket error", e);
          fail(new Error("WebSocket error"));
        };
        c.onWebSocketClose = (evt) => {
          console.warn("[STOMP] websocket closed", evt.code, evt.reason);
          // 1002: protocol error (서버 인증 실패 시 흔함)
          if (!settled) {
            fail(new Error(`WebSocket closed (code=${evt.code})`));
          }
        };

        c.activate();
      });

      client = c;
      lastToken = accessToken;
      return c;
    } catch (err) {
      try {
        await c.deactivate();
      } catch {}
      throw err;
    } finally {
      // 실패/성공 모두 정리: 다음 connect 시도 가능하게
      connectingPromise = null;
      if (!c.connected) {
        client = null;
        lastToken = null;
      }
    }
  })();

  return connectingPromise;
}

export async function disconnectChatSocket() {
  try {
    if (client) {
      await client.deactivate();
      debugLog("🧹 STOMP disconnected");
    }
  } finally {
    client = null;
    connectingPromise = null;
    lastToken = null;
  }
}

export async function subscribeRoom(
  roomId: string,
  onMessage: (msg: IncomingChatMessage) => void,
) {
  const c = await ensureChatSocket();
  const destination = `/topic/chat.room.${roomId}`;

  const sub = c.subscribe(destination, (message: IMessage) => {
    try {
      const parsed = JSON.parse(message.body) as IncomingChatMessage;
      onMessage(parsed);
    } catch (e) {
      console.error("Failed to parse message:", message.body, e);
    }
  });

  return () => sub.unsubscribe();
}

export async function publishChat(payload: SendChatPayload) {
  const c = await ensureChatSocket();
  c.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(payload),
  });
}
