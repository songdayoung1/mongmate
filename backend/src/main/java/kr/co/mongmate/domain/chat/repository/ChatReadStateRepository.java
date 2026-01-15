package kr.co.mongmate.domain.chat.repository;

import kr.co.mongmate.domain.chat.entity.ChatReadState;
import kr.co.mongmate.domain.chat.entity.ChatReadStateId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatReadStateRepository extends JpaRepository<ChatReadState, ChatReadStateId> {

    // ✅ 멤버십 존재 여부 = chat_read_state에 (threadId, userId) row가 있는가?
    boolean existsByIdThreadIdAndIdUserId(Long threadId, Long userId);
}
