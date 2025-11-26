package kr.co.mongmate.domain.walkpost.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.*;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "walk_post_like",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_post_like", columnNames = {"post_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_wpl_user", columnList = "user_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkPostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private WalkPost walkPost;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /* ==========================
     *      생성자 (Builder 전용)
     * ========================== */
    private WalkPostLike(
            Long id,
            WalkPost walkPost,
            User user,
            LocalDateTime createdAt
    ) {
        this.id = id;

        // 생성 시점 — 변경 메서드 호출하지 않음
        this.walkPost = Objects.requireNonNull(walkPost, "walkPost must not be null");
        this.user = Objects.requireNonNull(user, "user must not be null");

        this.createdAt = (createdAt != null) ? createdAt : LocalDateTime.now();
    }

    public static WalkPostLikeBuilder builder() {
        return new WalkPostLikeBuilder();
    }

    /* ==========================
     *        편의 메서드
     * ========================== */

    /**
     * 좋아요가 어떤 게시글/유저에 속하는지 변경하도록 허용할 일이 거의 없지만,
     * 일관성을 위해 change 메서드 추가.
     */
    public void changeWalkPost(WalkPost walkPost) {
        this.walkPost = Objects.requireNonNull(walkPost, "walkPost must not be null");
    }

    public void changeUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
    }

    /* ==========================
     *        Builder
     * ========================== */

    public static final class WalkPostLikeBuilder {
        private Long id;
        private WalkPost walkPost;
        private User user;
        private LocalDateTime createdAt;

        private WalkPostLikeBuilder() {}

        public WalkPostLikeBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public WalkPostLikeBuilder walkPost(WalkPost walkPost) {
            this.walkPost = walkPost;
            return this;
        }

        public WalkPostLikeBuilder user(User user) {
            this.user = user;
            return this;
        }

        public WalkPostLikeBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public WalkPostLike build() {
            Objects.requireNonNull(walkPost, "walkPost must not be null");
            Objects.requireNonNull(user, "user must not be null");

            return new WalkPostLike(
                    id,
                    walkPost,
                    user,
                    createdAt
            );
        }
    }
}
