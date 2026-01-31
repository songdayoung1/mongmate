package kr.co.mongmate.domain.chat.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.*;
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
    }

    /**
     *  관계 설정은 항상 builder에서 명시적 적용
     *  이 메시지가 어느 Thread에 속하는지는 필수 도메인 정보라서,
     *  생성 시점에 반드시 정해져 있어야 한다.
     */
    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }

    // 메세지 읽음 확인
    public void markAsRead() {
        this.read = Boolean.TRUE;
    }

    /**
     * 메시지의 소유자(발신자)가 candidate 사용자와 동일한지 여부를 반환.
     * 채팅 UI 정렬, 읽음 처리, 권한 검증 등 도메인 판단 로직에 사용.
     */
    public boolean isSentBy(User candidate) {
        return candidate != null
                && this.sender != null
                && Objects.equals(this.sender.getId(), candidate.getId());
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
