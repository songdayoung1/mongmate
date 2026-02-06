package kr.co.mongmate.api.chat.controller;

import kr.co.mongmate.api.chat.dto.ChatRoomListItemResponse;
import kr.co.mongmate.api.chat.service.ChatRoomListService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/rooms")
public class ChatRoomListController {

    private final ChatRoomListService chatRoomListService;

    @GetMapping
    public List<ChatRoomListItemResponse> loadMyRooms(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalStateException("principal is required");
        }
        return chatRoomListService.loadMyRooms(principal.getName());
    }
}
