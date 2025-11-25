package kr.co.mongmate.domain.user.entity;

import java.io.Serializable;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import kr.co.mongmate.domain.meta.entity.Badge;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode
public class UserBadgeId implements Serializable {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "badge_code", nullable = false, length = 30)
    private String badgeCode;

    private UserBadgeId(Long userId, String badgeCode) {
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
        this.badgeCode = Objects.requireNonNull(badgeCode, "badgeCode must not be null");
    }

    public static UserBadgeId of(Long userId, String badgeCode) {
        return new UserBadgeId(userId, badgeCode);
    }

    public static UserBadgeId from(User user, Badge badge) {
        return new UserBadgeId(resolveUserId(user), resolveBadgeCode(badge));
    }

    public static UserBadgeIdBuilder builder() {
        return new UserBadgeIdBuilder();
    }

    private static Long resolveUserId(User user) {
        Objects.requireNonNull(user, "user must not be null");
        return Objects.requireNonNull(user.getId(), "user.id must not be null");
    }

    private static String resolveBadgeCode(Badge badge) {
        Objects.requireNonNull(badge, "badge must not be null");
        return Objects.requireNonNull(badge.getBadgeCode(), "badge.badgeCode must not be null");
    }

    public static final class UserBadgeIdBuilder {
        private Long userId;
        private String badgeCode;
        private User user;
        private Badge badge;

        private UserBadgeIdBuilder() {
        }

        public UserBadgeIdBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public UserBadgeIdBuilder badgeCode(String badgeCode) {
            this.badgeCode = badgeCode;
            return this;
        }

        public UserBadgeIdBuilder user(User user) {
            this.user = user;
            return this;
        }

        public UserBadgeIdBuilder badge(Badge badge) {
            this.badge = badge;
            return this;
        }

        public UserBadgeId build() {
            Long resolvedUserId = this.userId != null ? this.userId : (user != null ? user.getId() : null);
            String resolvedBadgeCode = this.badgeCode != null ? this.badgeCode : (badge != null ? badge.getBadgeCode() : null);
            Objects.requireNonNull(resolvedUserId, "userId must not be null");
            Objects.requireNonNull(resolvedBadgeCode, "badgeCode must not be null");
            return new UserBadgeId(resolvedUserId, resolvedBadgeCode);
        }
    }
}
