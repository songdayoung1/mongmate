package kr.co.mongmate.api.chat.controller;

import kr.co.mongmate.api.chat.dto.ChatReadRequest;
import kr.co.mongmate.api.chat.dto.ChatReadResponse;
import kr.co.mongmate.api.chat.service.ChatRoomAccessService;
import kr.co.mongmate.infra.chat.service.ChatRedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;


@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chat/rooms")
public class ChatReadController {

    private final ChatRedisService chatRedisService;
    private final ChatRoomAccessService chatRoomAccessService;

    @PostMapping("/{roomId}/read")
    public ChatReadResponse markRead(@PathVariable String roomId,
                                     @RequestBody ChatReadRequest req,
                                     Principal principal) {

        String userId = principal.getName();

        // ✅ 권한 체크(멤버인가?)
        chatRoomAccessService.assertMember(roomId, userId);

        long current = chatRedisService.getCurrentSeq(roomId);
        long safeLastRead = Math.min(req.lastReadSeq(), current);

        chatRedisService.setLastReadSeq(roomId, userId, safeLastRead);
        return new ChatReadResponse(roomId, userId, safeLastRead);
    }
}
