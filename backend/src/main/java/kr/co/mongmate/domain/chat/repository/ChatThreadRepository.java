package kr.co.mongmate.domain.chat.repository;

import kr.co.mongmate.domain.chat.entity.ChatThread;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatThreadRepository extends JpaRepository<ChatThread, Long> {
    Optional<ChatThread> findByWalkPostIdAndAuthorIdAndParticipantId(Long postId, Long authorId, Long participantId);
}
