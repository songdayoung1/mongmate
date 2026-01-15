package kr.co.mongmate.domain.chat.repository;

import kr.co.mongmate.domain.chat.entity.ChatMessage;
import kr.co.mongmate.domain.chat.entity.ChatThread;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 채팅방의 마지막 메시지 (목록 API에서 사용)
    Optional<ChatMessage> findTopByChatThreadOrderBySentAtDesc(ChatThread chatThread);
}
