package kr.co.mongmate.api.chat.service;

import kr.co.mongmate.domain.chat.entity.ChatReadState;
import kr.co.mongmate.domain.chat.entity.ChatThread;
import kr.co.mongmate.domain.chat.repository.ChatReadStateRepository;
import kr.co.mongmate.domain.chat.repository.ChatThreadRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ChatRoomAccessService {

    private final ChatReadStateRepository chatReadStateRepository;
    private final ChatThreadRepository chatThreadRepository;
    private final UserRepository userRepository;

    public void assertMember(String roomId, String userId) {
        Long threadId = parseLongOrThrow(roomId, "roomId");
        Long uid = parseLongOrThrow(userId, "userId");

        boolean ok = chatReadStateRepository.existsByIdThreadIdAndIdUserId(threadId, uid);
        if (ok) return;

        ChatThread thread = chatThreadRepository.findById(threadId)
                .orElseThrow(() -> new ForbiddenChatRoomAccessException("Not a member of room: " + roomId));

        if (!Objects.equals(thread.getAuthor().getId(), uid) && !Objects.equals(thread.getParticipant().getId(), uid)) {
            throw new ForbiddenChatRoomAccessException("Not a member of room: " + roomId);
        }

        User user = Objects.equals(thread.getAuthor().getId(), uid)
                ? thread.getAuthor()
                : userRepository.getReferenceById(uid);

        try {
            chatReadStateRepository.save(
                    ChatReadState.builder()
                            .chatThread(thread)
                            .user(user)
                            .build()
            );
        } catch (DataIntegrityViolationException ignored) {
            // already created by concurrent request
        }
    }

    private Long parseLongOrThrow(String value, String field) {
        try {
            return Long.parseLong(value);
        } catch (Exception e) {
            throw new IllegalArgumentException(field + " must be a number: " + value);
        }
    }
}
