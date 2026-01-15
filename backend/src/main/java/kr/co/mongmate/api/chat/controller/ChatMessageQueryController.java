package kr.co.mongmate.api.chat.controller;

import kr.co.mongmate.api.chat.dto.ChatMessageDto;
import kr.co.mongmate.infra.chat.service.ChatRedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/rooms")
public class ChatMessageQueryController {

    private final ChatRedisService chatRedisService;

    @GetMapping("/{roomId}/messages")
    public List<ChatMessageDto> loadRecentMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit, 200)); // 과도한 요청 방지
        return chatRedisService.loadRecent(roomId, safeLimit);
    }
}
