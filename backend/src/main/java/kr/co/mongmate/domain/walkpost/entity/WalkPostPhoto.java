package kr.co.mongmate.domain.walkpost.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "walk_post_photo",
        indexes = {
                @Index(name = "idx_wpp_post", columnList = "post_id, sort_order")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkPostPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private WalkPost walkPost;

    @Column(name = "photo_url", length = 255, nullable = false)
    private String photoUrl;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /* ==========================
     *      생성자 (Builder 전용)
     * ========================== */
    private WalkPostPhoto(
            Long id,
            WalkPost walkPost,
            String photoUrl,
            Integer sortOrder,
            LocalDateTime createdAt
    ) {
        this.id = id;

        // 생성 시에는 changeXxx() 사용 X (updatedAt 고려할 필요 없음)
        this.walkPost = Objects.requireNonNull(walkPost, "walkPost must not be null");
        this.photoUrl = Objects.requireNonNull(photoUrl, "photoUrl must not be null");
        this.sortOrder = (sortOrder != null) ? sortOrder : 0;

        this.createdAt = (createdAt != null) ? createdAt : LocalDateTime.now();
    }

    public static WalkPostPhotoBuilder builder() {
        return new WalkPostPhotoBuilder();
    }

    /* ==========================
     *        편의 메서드
     * ========================== */

    public void changeWalkPost(WalkPost walkPost) {
        this.walkPost = Objects.requireNonNull(walkPost, "walkPost must not be null");
    }

    public void changePhotoUrl(String photoUrl) {
        this.photoUrl = Objects.requireNonNull(photoUrl, "photoUrl must not be null");
    }

    public void changeSortOrder(Integer sortOrder) {
        this.sortOrder = Objects.requireNonNull(sortOrder, "sortOrder must not be null");
    }

    /* ==========================
     *        Builder
     * ========================== */

    public static final class WalkPostPhotoBuilder {
        private Long id;
        private WalkPost walkPost;
        private String photoUrl;
        private Integer sortOrder;
        private LocalDateTime createdAt;

        private WalkPostPhotoBuilder() {}

        public WalkPostPhotoBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public WalkPostPhotoBuilder walkPost(WalkPost walkPost) {
            this.walkPost = walkPost;
            return this;
        }

        public WalkPostPhotoBuilder photoUrl(String photoUrl) {
            this.photoUrl = photoUrl;
            return this;
        }

        public WalkPostPhotoBuilder sortOrder(Integer sortOrder) {
            this.sortOrder = sortOrder;
            return this;
        }

        public WalkPostPhotoBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public WalkPostPhoto build() {
            Objects.requireNonNull(walkPost, "walkPost must not be null");
            Objects.requireNonNull(photoUrl, "photoUrl must not be null");

            return new WalkPostPhoto(
                    id,
                    walkPost,
                    photoUrl,
                    sortOrder,
                    createdAt
            );
        }
    }
}
