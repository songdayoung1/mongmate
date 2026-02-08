package kr.co.mongmate.domain.chat.service;

import kr.co.mongmate.domain.chat.entity.ChatMessage;
import kr.co.mongmate.domain.chat.entity.ChatThread;
import kr.co.mongmate.domain.chat.repository.ChatMessageRepository;
import kr.co.mongmate.domain.chat.repository.ChatThreadRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatThreadRepository chatThreadRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long saveMessage(String roomId, String userId, String content) {
        Long threadId = Long.valueOf(roomId);
        Long senderId = Long.valueOf(userId);

        // ✅ SELECT 최소화: FK 참조만 잡기 (필요 시에만 조회됨)
        ChatThread thread = chatThreadRepository.getReferenceById(threadId);
        User sender = userRepository.getReferenceById(senderId);

        LocalDateTime now = LocalDateTime.now();

        ChatMessage saved = chatMessageRepository.save(
                ChatMessage.builder()
                        .chatThread(thread)
                        .sender(sender)
                        .content(content)
                        .sentAt(now)
                        .build()
        );

        thread.touchUpdatedAt(now);

        return saved.getId();
    }
}

