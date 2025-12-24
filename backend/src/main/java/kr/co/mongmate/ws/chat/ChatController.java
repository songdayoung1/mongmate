package kr.co.mongmate.ws.chat;


import kr.co.mongmate.api.chat.dto.ChatMessageDto;
import kr.co.mongmate.infra.chat.service.ChatRedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * STOMP WebSocket 기반 채팅 메시지 핸들러
 *
 * 클라이언트:
 *  - /app/chat.send 로 메시지 전송
 *  - /topic/chat.room.{roomId} 구독
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRedisService chatRedisService;

    /**
     * 클라이언트가 /app/chat.send 로 메시지를 보내면 여기로 들어옴
     */
    @MessageMapping("/chat.send")
    public void handleChatMessage(ChatSendRequest req) {
        log.debug("Received message: roomId={}, userId={}, content={}",
                req.roomId(), req.userId(), req.content());

        // 서버에서 timestamp 채운 DTO 생성
        ChatMessageDto message = ChatMessageDto.of(
                req.roomId(),
                req.userId(),
                req.content()
        );

        // Redis 에 저장 (옵션이지만 실서비스 느낌)
        chatRedisService.saveMessage(message);

        // 해당 방을 구독 중인 모든 클라이언트에게 브로드캐스트
        String destination = "/topic/chat.room." + message.roomId();
        messagingTemplate.convertAndSend(destination, message);
    }

    /**
     * 클라이언트 → 서버로 들어오는 WebSocket 페이로드
     * (roomId, userId, content 만 받음)
     */
    public record ChatSendRequest(
            String roomId,
            String userId,
            String content
    ) {}
}
