package kr.co.mongmate.api.chat.service;

import kr.co.mongmate.domain.chat.repository.ChatReadStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatRoomAccessService {

    private final ChatReadStateRepository chatReadStateRepository;

    public void assertMember(String roomId, String userId) {
        Long threadId = parseLongOrThrow(roomId, "roomId");
        Long uid = parseLongOrThrow(userId, "userId");

        boolean ok = chatReadStateRepository.existsByIdThreadIdAndIdUserId(threadId, uid);
        if (!ok) throw new ForbiddenChatRoomAccessException("Not a member of room: " + roomId);
    }

    private Long parseLongOrThrow(String value, String field) {
        try {
            return Long.parseLong(value);
        } catch (Exception e) {
            throw new IllegalArgumentException(field + " must be a number: " + value);
        }
    }
}
