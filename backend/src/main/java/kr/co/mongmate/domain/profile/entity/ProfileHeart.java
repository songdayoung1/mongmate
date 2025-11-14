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

@Entity
@Table(
    name = "profile_heart",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_profile_heart", columnNames = {"target_user_id", "from_user_id"})
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProfileHeart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_user_id", nullable = false)
    private User targetUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User fromUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private ProfileHeart(
        Long id,
        User targetUser,
        User fromUser,
        LocalDateTime createdAt
    ) {
        this.id = id;
        assignTarget(targetUser);
        assignSender(fromUser);
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static ProfileHeartBuilder builder() {
        return new ProfileHeartBuilder();
    }

    public void assignTarget(User targetUser) {
        this.targetUser = Objects.requireNonNull(targetUser, "targetUser must not be null");
    }

    public void assignSender(User fromUser) {
        this.fromUser = Objects.requireNonNull(fromUser, "fromUser must not be null");
    }

    public boolean isGivenBy(User candidate) {
        return candidate != null
            && this.fromUser != null
            && Objects.equals(candidate.getId(), this.fromUser.getId());
    }

    public boolean targets(User candidate) {
        return candidate != null
            && this.targetUser != null
            && Objects.equals(candidate.getId(), this.targetUser.getId());
    }

    public static final class ProfileHeartBuilder {
        private Long id;
        private User targetUser;
        private User fromUser;
        private LocalDateTime createdAt;

        private ProfileHeartBuilder() {
        }

        public ProfileHeartBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ProfileHeartBuilder targetUser(User targetUser) {
            this.targetUser = targetUser;
            return this;
        }

        public ProfileHeartBuilder fromUser(User fromUser) {
            this.fromUser = fromUser;
            return this;
        }

        public ProfileHeartBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ProfileHeart build() {
            Objects.requireNonNull(targetUser, "targetUser must not be null");
            Objects.requireNonNull(fromUser, "fromUser must not be null");
            return new ProfileHeart(id, targetUser, fromUser, createdAt);
        }
    }
}
