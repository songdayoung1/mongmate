package kr.co.mongmate.domain.chat.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "chat_message",
    indexes = {
        @Index(name = "idx_cm_thread_time", columnList = "thread_id, sent_at")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "thread_id", nullable = false)
    private ChatThread chatThread;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_user_id", nullable = false)
    private User sender;

    @Lob
    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt;

    @Column(name = "is_read", nullable = false)
    private Boolean read = false;

    private ChatMessage(
        Long id,
        ChatThread chatThread,
        User sender,
        String content,
        LocalDateTime sentAt,
        Boolean read
    ) {
        this.id = id;
        this.chatThread = Objects.requireNonNull(chatThread, "chatThread must not be null");
        this.sender = Objects.requireNonNull(sender, "sender must not be null");
        this.content = Objects.requireNonNull(content, "content must not be null");
        this.sentAt = sentAt != null ? sentAt : LocalDateTime.now();
        this.read = read != null ? read : Boolean.FALSE;
        this.chatThread.registerMessage(this);
    }

    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }

    public void markAsRead() {
        this.read = Boolean.TRUE;
    }

    public boolean isSentBy(User candidate) {
        return candidate != null
            && this.sender != null
            && Objects.equals(this.sender.getId(), candidate.getId());
    }

    public void assignToThread(ChatThread targetThread) {
        Objects.requireNonNull(targetThread, "targetThread must not be null");

        if (this.chatThread == targetThread) {
            return;
        }

        if (this.chatThread != null) {
            this.chatThread.unregisterMessage(this);
        }

        this.chatThread = targetThread;
        targetThread.registerMessage(this);
    }

    void detachFromThread() {
        if (this.chatThread == null) {
            return;
        }

        ChatThread previous = this.chatThread;
        this.chatThread = null;
        previous.unregisterMessage(this);
    }

    public static final class ChatMessageBuilder {
        private Long id;
        private ChatThread chatThread;
        private User sender;
        private String content;
        private LocalDateTime sentAt;
        private Boolean read;

        private ChatMessageBuilder() {
        }

        public ChatMessageBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ChatMessageBuilder chatThread(ChatThread chatThread) {
            this.chatThread = chatThread;
            return this;
        }

        public ChatMessageBuilder sender(User sender) {
            this.sender = sender;
            return this;
        }

        public ChatMessageBuilder content(String content) {
            this.content = content;
            return this;
        }

        public ChatMessageBuilder sentAt(LocalDateTime sentAt) {
            this.sentAt = sentAt;
            return this;
        }

        public ChatMessageBuilder read(Boolean read) {
            this.read = read;
            return this;
        }

        public ChatMessage build() {
            return new ChatMessage(id, chatThread, sender, content, sentAt, read);
        }
    }
}
