package kr.co.mongmate.domain.chat.entity;

import java.io.Serializable;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode
public class ChatReadStateId implements Serializable {

    @Column(name = "thread_id", nullable = false)
    private Long threadId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private ChatReadStateId(Long threadId, Long userId) {
        this.threadId = Objects.requireNonNull(threadId, "threadId must not be null");
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
    }

    public static ChatReadStateId of(Long threadId, Long userId) {
        return new ChatReadStateId(threadId, userId);
    }

    public static ChatReadStateId from(ChatThread chatThread, User user) {
        return new ChatReadStateId(resolveThreadId(chatThread), resolveUserId(user));
    }

    public static ChatReadStateIdBuilder builder() {
        return new ChatReadStateIdBuilder();
    }

    private static Long resolveThreadId(ChatThread chatThread) {
        Objects.requireNonNull(chatThread, "chatThread must not be null");
        return Objects.requireNonNull(chatThread.getId(), "chatThread.id must not be null");
    }

    private static Long resolveUserId(User user) {
        Objects.requireNonNull(user, "user must not be null");
        return Objects.requireNonNull(user.getId(), "user.id must not be null");
    }

    public static final class ChatReadStateIdBuilder {
        private Long threadId;
        private Long userId;
        private ChatThread chatThread;
        private User user;

        private ChatReadStateIdBuilder() {
        }

        public ChatReadStateIdBuilder threadId(Long threadId) {
            this.threadId = threadId;
            return this;
        }

        public ChatReadStateIdBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public ChatReadStateIdBuilder chatThread(ChatThread chatThread) {
            this.chatThread = chatThread;
            return this;
        }

        public ChatReadStateIdBuilder user(User user) {
            this.user = user;
            return this;
        }

        public ChatReadStateId build() {
            Long resolvedThreadId = this.threadId != null ? this.threadId : (this.chatThread != null ? this.chatThread.getId() : null);
            Long resolvedUserId = this.userId != null ? this.userId : (this.user != null ? this.user.getId() : null);
            Objects.requireNonNull(resolvedThreadId, "threadId must not be null");
            Objects.requireNonNull(resolvedUserId, "userId must not be null");
            return new ChatReadStateId(resolvedThreadId, resolvedUserId);
        }
    }
}
