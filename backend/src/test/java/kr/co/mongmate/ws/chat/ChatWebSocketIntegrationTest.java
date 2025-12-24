package kr.co.mongmate.ws.chat;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Type;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import kr.co.mongmate.api.chat.dto.ChatMessageDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
        import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ChatWebSocketIntegrationTest {

    @LocalServerPort
    int port;

    @Autowired
    StringRedisTemplate redisTemplate;

    @Test
    void sendMessage_should_be_saved_to_redis() throws Exception {
        String roomId = "it-room-1";
        String key = "chat:" + roomId + ":messages";
        redisTemplate.delete(key);

        WebSocketStompClient stompClient =
                new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());

        StompSession session = stompClient
                .connectAsync("ws://localhost:" + port + "/ws-chat", new StompSessionHandlerAdapter() {})
                .get(3, TimeUnit.SECONDS);

        // 서버에 send
        session.send("/app/chat.send", new ChatController.ChatSendRequest(roomId, "user-1", "hello-ws"));

        // 약간 기다렸다가 redis 확인
        Thread.sleep(200);

        String saved = redisTemplate.opsForList().index(key, 0);

        assertThat(saved).isNotNull();
        assertThat(saved).contains("user-1");
        assertThat(saved).contains("hello-ws");
    }
}
