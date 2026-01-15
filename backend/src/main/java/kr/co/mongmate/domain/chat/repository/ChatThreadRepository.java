package kr.co.mongmate.domain.chat.repository;

import kr.co.mongmate.domain.chat.entity.ChatThread;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatThreadRepository extends JpaRepository<ChatThread, Long> {
}
