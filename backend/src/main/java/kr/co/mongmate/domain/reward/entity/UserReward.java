package kr.co.mongmate.domain.reward.entity;

import java.time.LocalDateTime;
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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "user_reward",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_reward", columnNames = {"user_id", "reward_policy_id"})
    },
    indexes = {
        @Index(name = "idx_ur_user", columnList = "user_id")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reward_policy_id", nullable = false)
    private RewardPolicy rewardPolicy;

    @Column(name = "awarded_at", nullable = false, updatable = false)
    private LocalDateTime awardedAt;

    private UserReward(
        Long id,
        User user,
        RewardPolicy rewardPolicy,
        LocalDateTime awardedAt
    ) {
        this.id = id;
        assignUser(user);
        assignRewardPolicy(rewardPolicy);
        this.awardedAt = awardedAt != null ? awardedAt : LocalDateTime.now();
    }

    public static UserRewardBuilder builder() {
        return new UserRewardBuilder();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
    }

    public void assignRewardPolicy(RewardPolicy rewardPolicy) {
        this.rewardPolicy = Objects.requireNonNull(rewardPolicy, "rewardPolicy must not be null");
    }

    public boolean belongsTo(User candidate) {
        return candidate != null
            && this.user != null
            && Objects.equals(candidate.getId(), this.user.getId());
    }

    public boolean matchesPolicy(RewardPolicy candidate) {
        return candidate != null
            && this.rewardPolicy != null
            && Objects.equals(candidate.getId(), this.rewardPolicy.getId());
    }

    public static final class UserRewardBuilder {
        private Long id;
        private User user;
        private RewardPolicy rewardPolicy;
        private LocalDateTime awardedAt;

        private UserRewardBuilder() {
        }

        public UserRewardBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public UserRewardBuilder user(User user) {
            this.user = user;
            return this;
        }

        public UserRewardBuilder rewardPolicy(RewardPolicy rewardPolicy) {
            this.rewardPolicy = rewardPolicy;
            return this;
        }

        public UserRewardBuilder awardedAt(LocalDateTime awardedAt) {
            this.awardedAt = awardedAt;
            return this;
        }

        public UserReward build() {
            Objects.requireNonNull(user, "user must not be null");
            Objects.requireNonNull(rewardPolicy, "rewardPolicy must not be null");
            return new UserReward(id, user, rewardPolicy, awardedAt);
        }
    }
}
