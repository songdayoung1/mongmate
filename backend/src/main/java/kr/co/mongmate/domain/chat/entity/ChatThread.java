// ChatThread
package kr.co.mongmate.domain.chat.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import jakarta.persistence.*;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
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
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED) // JPA용 기본 생성자만 허용
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

    @OneToMany(
            mappedBy = "chatThread",
            cascade = CascadeType.ALL   // 메시지는 스레드 라이프사이클에 따라 생성/삭제
            // orphanRemoval = false  // 메시지는 임의로 제거하지 않으므로 사용하지 않음
    )
    private List<ChatMessage> messages = new ArrayList<>();

    /**
     * 정적 팩토리 메서드
     *
     * - 이미 존재하는 대화방(동일 post + author + participant) 여부는
     *   Repository 계층에서 미리 검사한 뒤 이 팩토리를 호출하는 걸 전제로 함.
     *   (DB unique 제약도 함께 방어선 역할)
     *
     * - 사용자 정지 상태, 자기 자신에게 대화방 생성 등의 도메인 규칙은
     *   가능한 한 이 팩토리 내부에서 검증.
     */
    public static ChatThread create(
            WalkPost walkPost,
            User author,
            User participant
    ) {
        Objects.requireNonNull(walkPost, "walkPost must not be null");
        Objects.requireNonNull(author, "author must not be null");
        Objects.requireNonNull(participant, "participant must not be null");

        validateDifferentUsers(author, participant);

        return new ChatThread(
                walkPost,
                author,
                participant,
                LocalDateTime.now()
        );
    }

    private ChatThread(
            WalkPost walkPost,
            User author,
            User participant,
            LocalDateTime createdAt
    ) {
        this.walkPost = walkPost;
        this.author = author;
        this.participant = participant;
        this.createdAt = createdAt;
    }

    /**
     * author와 participant가 동일한 경우 방 생성 금지.
     */
    private static void validateDifferentUsers(User author, User participant) {
        if (Objects.equals(author.getId(), participant.getId())) {
            throw new IllegalArgumentException("작성자와 참가자는 서로 다른 사용자여야 합니다.");
        }
    }

    /**
     * 연관관계의 주인은 ChatMessage.chatThread 이고,
     * 여기서는 컬렉션 쪽 일관성만 맞춰주는 역할만 한다.
     */
    public void addMessage(ChatMessage message) {
        Objects.requireNonNull(message, "message must not be null");

        if (message.getChatThread() != this) {
            throw new IllegalStateException(
                    "ChatMessage.chatThread가 현재 ChatThread와 다릅니다. " +
                            "메시지 생성 시 올바른 thread를 설정한 뒤 addMessage를 호출하세요."
            );
        }

        if (!messages.contains(message)) {
            messages.add(message);
        }
    }

}
