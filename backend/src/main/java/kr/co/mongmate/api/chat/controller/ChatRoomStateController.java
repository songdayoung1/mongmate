package kr.co.mongmate.api.chat.controller;

import kr.co.mongmate.api.chat.dto.ChatRoomStateResponse;
import kr.co.mongmate.api.chat.service.ChatRoomAccessService;
import kr.co.mongmate.infra.chat.service.ChatRedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;



@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chat/rooms")
public class ChatRoomStateController {

    private final ChatRedisService chatRedisService;
    private final ChatRoomAccessService chatRoomAccessService;

    @GetMapping("/{roomId}/state")
    public ChatRoomStateResponse getState(@PathVariable String roomId, Principal principal) {
        String userId = principal.getName();

        // ✅ 권한 체크(멤버인가?)
        chatRoomAccessService.assertMember(roomId, userId);

        long current = chatRedisService.getCurrentSeq(roomId);
        long lastRead = chatRedisService.getLastReadSeq(roomId, userId);
        long unread = Math.max(0, current - lastRead);

        return new ChatRoomStateResponse(roomId, current, lastRead, unread);
    }
}
