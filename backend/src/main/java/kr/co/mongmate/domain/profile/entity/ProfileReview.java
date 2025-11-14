package kr.co.mongmate.domain.profile.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;

@Entity
@Table(
    name = "profile_review",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_profile_review", columnNames = {"target_user_id", "reviewer_user_id"})
    }
)
@Check(constraints = "rating BETWEEN 1 AND 5")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProfileReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_user_id", nullable = false)
    private User targetUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_user_id", nullable = false)
    private User reviewerUser;

    @Column(name = "rating", nullable = false)
    private Byte rating;

    @Column(name = "comment", length = 500)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private ProfileReview(
        Long id,
        User targetUser,
        User reviewerUser,
        Byte rating,
        String comment,
        LocalDateTime createdAt
    ) {
        this.id = id;
        assignTarget(targetUser);
        assignReviewer(reviewerUser);
        changeRating(rating);
        updateComment(comment);
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static ProfileReviewBuilder builder() {
        return new ProfileReviewBuilder();
    }

    public void assignTarget(User targetUser) {
        this.targetUser = Objects.requireNonNull(targetUser, "targetUser must not be null");
    }

    public void assignReviewer(User reviewerUser) {
        this.reviewerUser = Objects.requireNonNull(reviewerUser, "reviewerUser must not be null");
    }

    public void changeRating(Byte rating) {
        Objects.requireNonNull(rating, "rating must not be null");
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }
        this.rating = rating;
    }

    public void updateComment(String comment) {
        this.comment = comment;
    }

    public boolean isAuthoredBy(User candidate) {
        return candidate != null
            && this.reviewerUser != null
            && Objects.equals(candidate.getId(), this.reviewerUser.getId());
    }

    public boolean targets(User candidate) {
        return candidate != null
            && this.targetUser != null
            && Objects.equals(candidate.getId(), this.targetUser.getId());
    }

    public static final class ProfileReviewBuilder {
        private Long id;
        private User targetUser;
        private User reviewerUser;
        private Byte rating;
        private String comment;
        private LocalDateTime createdAt;

        private ProfileReviewBuilder() {
        }

        public ProfileReviewBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ProfileReviewBuilder targetUser(User targetUser) {
            this.targetUser = targetUser;
            return this;
        }

        public ProfileReviewBuilder reviewerUser(User reviewerUser) {
            this.reviewerUser = reviewerUser;
            return this;
        }

        public ProfileReviewBuilder rating(Byte rating) {
            this.rating = rating;
            return this;
        }

        public ProfileReviewBuilder comment(String comment) {
            this.comment = comment;
            return this;
        }

        public ProfileReviewBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ProfileReview build() {
            Objects.requireNonNull(targetUser, "targetUser must not be null");
            Objects.requireNonNull(reviewerUser, "reviewerUser must not be null");
            Objects.requireNonNull(rating, "rating must not be null");
            return new ProfileReview(id, targetUser, reviewerUser, rating, comment, createdAt);
        }
    }
}
