package kr.co.mongmate.domain.chat.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "chat_read_state",
    indexes = {
        @Index(name = "idx_crs_user", columnList = "user_id, thread_id")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatReadState {

    @EmbeddedId
    private ChatReadStateId id;

    @MapsId("threadId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "thread_id", nullable = false)
    private ChatThread chatThread;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_read_message_id")
    private ChatMessage lastReadMessage;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    private ChatReadState(
        ChatReadStateId id,
        ChatThread chatThread,
        User user,
        ChatMessage lastReadMessage,
        LocalDateTime updatedAt
    ) {
        this.id = id != null ? id : ChatReadStateId.empty();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
        assignThread(chatThread);
        assignUser(user);
        if (lastReadMessage != null) {
            updateLastReadMessage(lastReadMessage, this.updatedAt);
        }
    }

    public static ChatReadStateBuilder builder() {
        return new ChatReadStateBuilder();
    }

    public void assignThread(ChatThread chatThread) {
        this.chatThread = Objects.requireNonNull(chatThread, "chatThread must not be null");
        syncIdentifier();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
        syncIdentifier();
    }

    public void updateLastReadMessage(ChatMessage lastReadMessage) {
        updateLastReadMessage(lastReadMessage, LocalDateTime.now());
    }

    private void updateLastReadMessage(ChatMessage lastReadMessage, LocalDateTime timestamp) {
        if (lastReadMessage == null) {
            this.lastReadMessage = null;
            this.updatedAt = timestamp;
            return;
        }

        if (!Objects.equals(lastReadMessage.getChatThread(), this.chatThread)) {
            throw new IllegalArgumentException("Last read message must belong to the same thread.");
        }

        this.lastReadMessage = lastReadMessage;
        this.updatedAt = timestamp;
    }

    private void syncIdentifier() {
        if (this.chatThread == null || this.user == null) {
            return;
        }

        Long threadId = this.chatThread.getId();
        Long userId = this.user.getId();

        if (threadId == null || userId == null) {
            return;
        }

        this.id = ChatReadStateId.of(threadId, userId);
    }

    public static final class ChatReadStateBuilder {
        private ChatReadStateId id;
        private ChatThread chatThread;
        private User user;
        private ChatMessage lastReadMessage;
        private LocalDateTime updatedAt;

        private ChatReadStateBuilder() {
        }

        public ChatReadStateBuilder id(ChatReadStateId id) {
            this.id = id;
            return this;
        }

        public ChatReadStateBuilder chatThread(ChatThread chatThread) {
            this.chatThread = chatThread;
            return this;
        }

        public ChatReadStateBuilder user(User user) {
            this.user = user;
            return this;
        }

        public ChatReadStateBuilder lastReadMessage(ChatMessage lastReadMessage) {
            this.lastReadMessage = lastReadMessage;
            return this;
        }

        public ChatReadStateBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public ChatReadState build() {
            validate();
            ChatReadStateId resolvedId = resolveIdentifier();
            return new ChatReadState(resolvedId, chatThread, user, lastReadMessage, updatedAt);
        }

        private void validate() {
            Objects.requireNonNull(chatThread, "chatThread must not be null");
            Objects.requireNonNull(user, "user must not be null");
        }

        private ChatReadStateId resolveIdentifier() {
            if (id != null) {
                return id;
            }

            Long threadId = chatThread.getId();
            Long userId = user.getId();

            if (threadId == null || userId == null) {
                return ChatReadStateId.empty();
            }

            return ChatReadStateId.of(threadId, userId);
        }
    }
}
