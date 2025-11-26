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
        name = "walk_post_view_log",
        indexes = {
                @Index(name = "idx_wpvlog_post_time", columnList = "post_id, viewed_at")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkPostViewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private WalkPost walkPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viewer_id")
    private User viewer;

    @Column(name = "viewed_at", nullable = false, updatable = false)
    private LocalDateTime viewedAt;

    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    @Column(name = "ua_hash", length = 64)
    private String uaHash;

    /* ==========================
     *      생성자 (Builder 전용)
     * ========================== */
    private WalkPostViewLog(
            Long id,
            WalkPost walkPost,
            User viewer,
            LocalDateTime viewedAt,
            String ipHash,
            String uaHash
    ) {
        this.id = id;

        this.walkPost = Objects.requireNonNull(walkPost, "walkPost must not be null");
        this.viewer = viewer; // nullable OK

        this.viewedAt = (viewedAt != null) ? viewedAt : LocalDateTime.now();

        this.ipHash = ipHash;
        this.uaHash = uaHash;
    }

    public static WalkPostViewLogBuilder builder() {
        return new WalkPostViewLogBuilder();
    }

    /* ==========================
     *        편의 메서드
     * ========================== */

    /** IP 해시 갱신 */
    public void changeIpHash(String ipHash) {
        this.ipHash = ipHash;
    }

    /** User-Agent 해시 갱신 */
    public void changeUaHash(String uaHash) {
        this.uaHash = uaHash;
    }

    /** Viewer 교체 (nullable) */
    public void changeViewer(User viewer) {
        this.viewer = viewer;
    }

    /* ==========================
     *        Builder
     * ========================== */

    public static final class WalkPostViewLogBuilder {
        private Long id;
        private WalkPost walkPost;
        private User viewer;
        private LocalDateTime viewedAt;
        private String ipHash;
        private String uaHash;

        private WalkPostViewLogBuilder() {}

        public WalkPostViewLogBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public WalkPostViewLogBuilder walkPost(WalkPost walkPost) {
            this.walkPost = walkPost;
            return this;
        }

        public WalkPostViewLogBuilder viewer(User viewer) {
            this.viewer = viewer;
            return this;
        }

        public WalkPostViewLogBuilder viewedAt(LocalDateTime viewedAt) {
            this.viewedAt = viewedAt;
            return this;
        }

        public WalkPostViewLogBuilder ipHash(String ipHash) {
            this.ipHash = ipHash;
            return this;
        }

        public WalkPostViewLogBuilder uaHash(String uaHash) {
            this.uaHash = uaHash;
            return this;
        }

        public WalkPostViewLog build() {
            Objects.requireNonNull(walkPost, "walkPost must not be null");

            return new WalkPostViewLog(
                    id,
                    walkPost,
                    viewer,
                    viewedAt,
                    ipHash,
                    uaHash
            );
        }
    }
}
