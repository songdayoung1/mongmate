package kr.co.mongmate.domain.profile.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "guardian_profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GuardianProfile {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "nickname", length = 30, nullable = false)
    private String nickname;

    @Column(name = "gender_code", length = 10)
    private String genderCode;

    @Column(name = "bio", length = 300)
    private String bio;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(name = "hearts_count", nullable = false)
    private Integer heartsCount = 0;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    private GuardianProfile(
        Long userId,
        User user,
        String nickname,
        String genderCode,
        String bio,
        String avatarUrl,
        Integer heartsCount,
        Integer reviewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
        this.userId = userId;
        assignUser(user);
        changeNickname(nickname);
        this.genderCode = genderCode;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.heartsCount = heartsCount != null ? heartsCount : 0;
        this.reviewCount = reviewCount != null ? reviewCount : 0;
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = createdAt != null ? createdAt : now;
        this.updatedAt = updatedAt != null ? updatedAt : now;
    }

    public static GuardianProfileBuilder builder() {
        return new GuardianProfileBuilder();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
        if (user.getId() == null) {
            throw new IllegalArgumentException("user.id must not be null");
        }
        this.userId = user.getId();
    }

    public void changeNickname(String nickname) {
        this.nickname = Objects.requireNonNull(nickname, "nickname must not be null");
        touch();
    }

    public void updateGender(String genderCode) {
        this.genderCode = genderCode;
        touch();
    }

    public void updateBio(String bio) {
        this.bio = bio;
        touch();
    }

    public void updateAvatar(String avatarUrl) {
        this.avatarUrl = avatarUrl;
        touch();
    }

    public void increaseHearts(int amount) {
        adjustCount(validatePositive(amount), true);
    }

    public void increaseReviews(int amount) {
        adjustCount(validatePositive(amount), false);
    }

    public void decreaseHearts(int amount) {
        adjustCount(-validatePositive(amount), true);
    }

    public void decreaseReviews(int amount) {
        adjustCount(-validatePositive(amount), false);
    }

    private void adjustCount(int amount, boolean hearts) {
        if (amount == 0) {
            return;
        }
        if (hearts) {
            this.heartsCount = Math.max(0, (this.heartsCount != null ? this.heartsCount : 0) + amount);
        } else {
            this.reviewCount = Math.max(0, (this.reviewCount != null ? this.reviewCount : 0) + amount);
        }
        touch();
    }

    private int validatePositive(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
        return amount;
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public static final class GuardianProfileBuilder {
        private Long userId;
        private User user;
        private String nickname;
        private String genderCode;
        private String bio;
        private String avatarUrl;
        private Integer heartsCount;
        private Integer reviewCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private GuardianProfileBuilder() {
        }

        public GuardianProfileBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public GuardianProfileBuilder user(User user) {
            this.user = user;
            return this;
        }

        public GuardianProfileBuilder nickname(String nickname) {
            this.nickname = nickname;
            return this;
        }

        public GuardianProfileBuilder genderCode(String genderCode) {
            this.genderCode = genderCode;
            return this;
        }

        public GuardianProfileBuilder bio(String bio) {
            this.bio = bio;
            return this;
        }

        public GuardianProfileBuilder avatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
            return this;
        }

        public GuardianProfileBuilder heartsCount(Integer heartsCount) {
            this.heartsCount = heartsCount;
            return this;
        }

        public GuardianProfileBuilder reviewCount(Integer reviewCount) {
            this.reviewCount = reviewCount;
            return this;
        }

        public GuardianProfileBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public GuardianProfileBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public GuardianProfile build() {
            Objects.requireNonNull(user, "user must not be null");
            Objects.requireNonNull(nickname, "nickname must not be null");
            return new GuardianProfile(
                userId,
                user,
                nickname,
                genderCode,
                bio,
                avatarUrl,
                heartsCount,
                reviewCount,
                createdAt,
                updatedAt
            );
        }
    }
}
