package kr.co.mongmate.domain.user.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import kr.co.mongmate.domain.meta.entity.Badge;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_badge")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBadge {

    @EmbeddedId
    private UserBadgeId id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @MapsId("badgeCode")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "badge_code", nullable = false)
    private Badge badge;

    @Column(name = "awarded_at", nullable = false)
    private LocalDateTime awardedAt;

    private UserBadge(
        UserBadgeId id,
        User user,
        Badge badge,
        LocalDateTime awardedAt
    ) {
        assignUser(user);
        assignBadge(badge);
        this.id = id != null ? id : resolveId();
        this.awardedAt = awardedAt != null ? awardedAt : LocalDateTime.now();
    }

    public static UserBadgeBuilder builder() {
        return new UserBadgeBuilder();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
        syncIdentifier();
    }

    public void assignBadge(Badge badge) {
        this.badge = Objects.requireNonNull(badge, "badge must not be null");
        syncIdentifier();
    }

    public boolean matchesBadge(String badgeCode) {
        return badgeCode != null
            && this.id != null
            && Objects.equals(this.id.getBadgeCode(), badgeCode);
    }

    private void syncIdentifier() {
        if (this.user == null || this.badge == null) {
            return;
        }
        if (this.user.getId() == null || this.badge.getBadgeCode() == null) {
            return;
        }
        this.id = new UserBadgeId(this.user.getId(), this.badge.getBadgeCode());
    }

    private UserBadgeId resolveId() {
        if (this.user == null || this.badge == null) {
            return null;
        }
        if (this.user.getId() == null || this.badge.getBadgeCode() == null) {
            return null;
        }
        return new UserBadgeId(this.user.getId(), this.badge.getBadgeCode());
    }

    public static final class UserBadgeBuilder {
        private UserBadgeId id;
        private User user;
        private Badge badge;
        private LocalDateTime awardedAt;

        private UserBadgeBuilder() {
        }

        public UserBadgeBuilder id(UserBadgeId id) {
            this.id = id;
            return this;
        }

        public UserBadgeBuilder user(User user) {
            this.user = user;
            return this;
        }

        public UserBadgeBuilder badge(Badge badge) {
            this.badge = badge;
            return this;
        }

        public UserBadgeBuilder awardedAt(LocalDateTime awardedAt) {
            this.awardedAt = awardedAt;
            return this;
        }

        public UserBadge build() {
            Objects.requireNonNull(user, "user must not be null");
            Objects.requireNonNull(badge, "badge must not be null");
            return new UserBadge(id, user, badge, awardedAt);
        }
    }
}
