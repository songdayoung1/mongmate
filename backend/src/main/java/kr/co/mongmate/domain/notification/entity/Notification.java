package kr.co.mongmate.domain.notification.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "notification",
    indexes = {
        @Index(name = "idx_not_user_time", columnList = "user_id, created_at")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private Type type;

    @Column(name = "ref_id")
    private Long refId;

    @Column(name = "title", length = 100)
    private String title;

    @Column(name = "body", length = 200)
    private String body;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private Notification(
        Long id,
        User user,
        Type type,
        Long refId,
        String title,
        String body,
        LocalDateTime sentAt,
        LocalDateTime readAt,
        LocalDateTime createdAt
    ) {
        this.id = id;
        assignUser(user);
        this.type = Objects.requireNonNull(type, "type must not be null");
        this.refId = refId;
        this.title = title;
        this.body = body;
        this.sentAt = sentAt;
        this.readAt = readAt;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static NotificationBuilder builder() {
        return new NotificationBuilder();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
    }

    public void markSent() {
        this.sentAt = LocalDateTime.now();
    }

    public void markSent(LocalDateTime timestamp) {
        this.sentAt = timestamp != null ? timestamp : LocalDateTime.now();
    }

    public void markRead() {
        this.readAt = LocalDateTime.now();
    }

    public void markUnread() {
        this.readAt = null;
    }

    public boolean isRead() {
        return this.readAt != null;
    }

    public static final class NotificationBuilder {
        private Long id;
        private User user;
        private Type type;
        private Long refId;
        private String title;
        private String body;
        private LocalDateTime sentAt;
        private LocalDateTime readAt;
        private LocalDateTime createdAt;

        private NotificationBuilder() {
        }

        public NotificationBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public NotificationBuilder user(User user) {
            this.user = user;
            return this;
        }

        public NotificationBuilder type(Type type) {
            this.type = type;
            return this;
        }

        public NotificationBuilder refId(Long refId) {
            this.refId = refId;
            return this;
        }

        public NotificationBuilder title(String title) {
            this.title = title;
            return this;
        }

        public NotificationBuilder body(String body) {
            this.body = body;
            return this;
        }

        public NotificationBuilder sentAt(LocalDateTime sentAt) {
            this.sentAt = sentAt;
            return this;
        }

        public NotificationBuilder readAt(LocalDateTime readAt) {
            this.readAt = readAt;
            return this;
        }

        public NotificationBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Notification build() {
            Objects.requireNonNull(user, "user must not be null");
            Objects.requireNonNull(type, "type must not be null");
            return new Notification(id, user, type, refId, title, body, sentAt, readAt, createdAt);
        }
    }

    public enum Type {
        CHAT_NEW_MESSAGE,
        SYSTEM,
        REMINDER
    }
}
