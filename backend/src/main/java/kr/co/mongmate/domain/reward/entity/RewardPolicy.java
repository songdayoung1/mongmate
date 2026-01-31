package kr.co.mongmate.domain.reward.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import kr.co.mongmate.domain.meta.entity.Badge;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reward_policy")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RewardPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_type", nullable = false, length = 20)
    private ConditionType conditionType;

    @Column(name = "condition_value")
    private Integer conditionValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_code")
    private Badge badge;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private RewardPolicy(
        Long id,
        String name,
        ConditionType conditionType,
        Integer conditionValue,
        Badge badge,
        LocalDateTime createdAt
    ) {
        this.id = id;
        changeName(name);
        changeCondition(conditionType, conditionValue);
        assignBadge(badge);
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static RewardPolicyBuilder builder() {
        return new RewardPolicyBuilder();
    }

    public void assignBadge(Badge badge) {
        this.badge = badge;
    }

    public void changeName(String name) {
        this.name = Objects.requireNonNull(name, "name must not be null");
    }

    public void changeCondition(ConditionType conditionType, Integer conditionValue) {
        this.conditionType = Objects.requireNonNull(conditionType, "conditionType must not be null");
        this.conditionValue = conditionValue;
    }

    public void updateConditionValue(Integer conditionValue) {
        this.conditionValue = conditionValue;
    }

    public boolean matchesCondition(ConditionType type) {
        return this.conditionType == type;
    }

    public static final class RewardPolicyBuilder {
        private Long id;
        private String name;
        private ConditionType conditionType;
        private Integer conditionValue;
        private Badge badge;
        private LocalDateTime createdAt;

        private RewardPolicyBuilder() {
        }

        public RewardPolicyBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public RewardPolicyBuilder name(String name) {
            this.name = name;
            return this;
        }

        public RewardPolicyBuilder conditionType(ConditionType conditionType) {
            this.conditionType = conditionType;
            return this;
        }

        public RewardPolicyBuilder conditionValue(Integer conditionValue) {
            this.conditionValue = conditionValue;
            return this;
        }

        public RewardPolicyBuilder badge(Badge badge) {
            this.badge = badge;
            return this;
        }

        public RewardPolicyBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public RewardPolicy build() {
            Objects.requireNonNull(name, "name must not be null");
            Objects.requireNonNull(conditionType, "conditionType must not be null");
            return new RewardPolicy(id, name, conditionType, conditionValue, badge, createdAt);
        }
    }

    public enum ConditionType {
        TOTAL_DISTANCE,
        FIRST_WALK,
        SESSION_COUNT
    }
}
