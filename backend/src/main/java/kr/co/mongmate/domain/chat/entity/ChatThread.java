package kr.co.mongmate.domain.chat.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "chat_thread",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_thread_unique",
            columnNames = {"post_id", "author_user_id", "participant_user_id"}
        )
    },
    indexes = {
        @Index(name = "idx_ct_user", columnList = "author_user_id, participant_user_id")
    }
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private WalkPost walkPost;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_user_id", nullable = false)
    private User participant;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "chatThread")
    private List<ChatMessage> messages = new ArrayList<>();

    public void addMessage(ChatMessage message) {
        Objects.requireNonNull(message, "message must not be null");
        message.assignToThread(this);
    }

    public void removeMessage(ChatMessage message) {
        if (message == null) {
            return;
        }

        if (messages.contains(message)) {
            message.detachFromThread();
        }
    }

    void registerMessage(ChatMessage message) {
        if (!messages.contains(message)) {
            messages.add(message);
        }
    }

    void unregisterMessage(ChatMessage message) {
        messages.remove(message);
    }
}
