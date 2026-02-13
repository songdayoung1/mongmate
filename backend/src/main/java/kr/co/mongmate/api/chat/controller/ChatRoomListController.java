package kr.co.mongmate.api.chat.controller;

import kr.co.mongmate.api.chat.dto.ChatRoomListItemResponse;
import kr.co.mongmate.api.chat.service.ChatRoomListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/rooms")
public class ChatRoomListController {

    private final ChatRoomListService chatRoomListService;

    @GetMapping
    public List<ChatRoomListItemResponse> loadMyRooms(Principal principal) {
        return chatRoomListService.loadMyRooms(requireUserId(principal));
    }

    private String requireUserId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized");
        }
        return principal.getName();
    }
}
