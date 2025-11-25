package kr.co.mongmate.domain.walkpost.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import org.locationtech.jts.geom.Point;

import jakarta.persistence.*;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "walk_post",
        indexes = {
                @Index(name = "idx_wp_region_deadline", columnList = "region_id, deadline_at"),
                @Index(name = "idx_wp_author", columnList = "author_user_id, status")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    private User author;

    @Column(name = "title", length = 100, nullable = false)
    private String title;

    @Lob
    private String content;

    @Column(name = "region_id", nullable = false)
    private Long regionId;

    @Column(name = "deadline_at")
    private LocalDateTime deadlineAt;

    @Column(name = "meet_location", columnDefinition = "geometry(Point,4326)")
    private Point meetLocation;

    @Column(name = "meet_address", length = 200)
    private String meetAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum Status {
        OPEN,
        COMPLETED,
        EXPIRED
    }

    /* ==========================
     *      생성자 (Builder 전용)
     * ========================== */

    private WalkPost(
            Long id,
            User author,
            String title,
            String content,
            Long regionId,
            LocalDateTime deadlineAt,
            Point meetLocation,
            String meetAddress,
            Status status,
            Integer viewCount,
            Integer likeCount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;

        // 생성 시는 changeXxx() 대신 직접 세팅 (updatedAt 여러 번 갱신 방지)
        this.author = Objects.requireNonNull(author, "author must not be null");
        this.title = Objects.requireNonNull(title, "title must not be null");
        this.regionId = Objects.requireNonNull(regionId, "regionId must not be null");

        this.content = content;
        this.deadlineAt = deadlineAt;
        this.meetLocation = meetLocation;
        this.meetAddress = meetAddress;

        this.status = (status != null) ? status : Status.OPEN;
        this.viewCount = (viewCount != null) ? viewCount : 0;
        this.likeCount = (likeCount != null) ? likeCount : 0;

        LocalDateTime base = (createdAt != null) ? createdAt : LocalDateTime.now();
        this.createdAt = base;
        this.updatedAt = (updatedAt != null) ? updatedAt : base;
    }

    public static WalkPostBuilder builder() {
        return new WalkPostBuilder();
    }

    /* ==========================
     *        변경 메서드
     * ========================== */

    // 변경 = updatedAt 변동
    public void changeTitle(String title) {
        this.title = Objects.requireNonNull(title, "title must not be null");
        touchUpdatedAt();
    }

    public void changeContent(String content) {
        this.content = content;
        touchUpdatedAt();
    }

    public void changeRegion(Long regionId) {
        this.regionId = Objects.requireNonNull(regionId, "regionId must not be null");
        touchUpdatedAt();
    }

    public void changeDeadline(LocalDateTime deadlineAt) {
        this.deadlineAt = deadlineAt;
        touchUpdatedAt();
    }

    public void changeMeetLocation(Point meetLocation) {
        this.meetLocation = meetLocation;
        touchUpdatedAt();
    }

    public void changeMeetAddress(String meetAddress) {
        this.meetAddress = meetAddress;
        touchUpdatedAt();
    }

    public void changeStatus(Status status) {
        this.status = Objects.requireNonNull(status, "status must not be null");
        touchUpdatedAt();
    }

    public void expire() {
        this.status = Status.EXPIRED;
        touchUpdatedAt();
    }

    /* ==========================
     *        카운터 메서드
     * ========================== */

    /** 조회수는 updatedAt 건드리지 않음 */
    public void increaseView() {
        this.viewCount = this.viewCount + 1;
    }

    /** 좋아요는 updatedAt = 유저 상호작용으로 간주하여 갱신 */
    public void increaseLike() {
        this.likeCount = this.likeCount + 1;
        touchUpdatedAt();
    }

    /** 좋아요 감소도 meaningful change → updatedAt 갱신 */
    public void decreaseLike() {
        if (this.likeCount > 0) {
            this.likeCount = this.likeCount - 1;
            touchUpdatedAt();
        }
    }

    private void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }

    /* ==========================
     *        Builder
     * ========================== */

    public static final class WalkPostBuilder {
        private Long id;
        private User author;
        private String title;
        private String content;
        private Long regionId;
        private LocalDateTime deadlineAt;
        private Point meetLocation;
        private String meetAddress;
        private Status status;
        private Integer viewCount;
        private Integer likeCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private WalkPostBuilder() {
        }

        public WalkPostBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public WalkPostBuilder author(User author) {
            this.author = author;
            return this;
        }

        public WalkPostBuilder title(String title) {
            this.title = title;
            return this;
        }

        public WalkPostBuilder content(String content) {
            this.content = content;
            return this;
        }

        public WalkPostBuilder regionId(Long regionId) {
            this.regionId = regionId;
            return this;
        }

        public WalkPostBuilder deadlineAt(LocalDateTime deadlineAt) {
            this.deadlineAt = deadlineAt;
            return this;
        }

        public WalkPostBuilder meetLocation(Point meetLocation) {
            this.meetLocation = meetLocation;
            return this;
        }

        public WalkPostBuilder meetAddress(String meetAddress) {
            this.meetAddress = meetAddress;
            return this;
        }

        public WalkPostBuilder status(Status status) {
            this.status = status;
            return this;
        }

        public WalkPostBuilder viewCount(Integer viewCount) {
            this.viewCount = viewCount;
            return this;
        }

        public WalkPostBuilder likeCount(Integer likeCount) {
            this.likeCount = likeCount;
            return this;
        }

        public WalkPostBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public WalkPostBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public WalkPost build() {
            Objects.requireNonNull(author, "author must not be null");
            Objects.requireNonNull(title, "title must not be null");
            Objects.requireNonNull(regionId, "regionId must not be null");

            return new WalkPost(
                    id,
                    author,
                    title,
                    content,
                    regionId,
                    deadlineAt,
                    meetLocation,
                    meetAddress,
                    status,
                    viewCount,
                    likeCount,
                    createdAt,
                    updatedAt
            );
        }
    }
}
