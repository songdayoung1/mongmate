package kr.co.mongmate.ws.chat.controller;

import kr.co.mongmate.api.chat.dto.ChatMessageDto;
import kr.co.mongmate.api.chat.service.ChatRoomAccessService;
import kr.co.mongmate.domain.chat.service.ChatMessageService;
import kr.co.mongmate.infra.chat.service.ChatRedisService;
import kr.co.mongmate.ws.chat.dto.ChatSendRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRedisService chatRedisService;
    private final ChatRoomAccessService chatRoomAccessService;
    private final ChatMessageService chatMessageService;


    @MessageMapping("/chat.send")
    public void handleChatMessage(ChatSendRequest req, Principal principal) {

        String userId = principal.getName(); // 인증된 사용자

        // 인가(멤버 체크)
        chatRoomAccessService.assertMember(req.roomId(), userId);

        // DB 영속화 추가 (실패 시 예외 -> STOMP ERROR)
        chatMessageService.saveMessage(req.roomId(), userId, req.content());

        long seq = chatRedisService.nextSeq(req.roomId());

        ChatMessageDto message = ChatMessageDto.of(
                req.roomId(),
                seq,
                userId,
                req.content()
        );

        chatRedisService.saveMessage(message);
        messagingTemplate.convertAndSend("/topic/chat.room." + message.roomId(), message);
    }
}
