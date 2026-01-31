package kr.co.mongmate.domain.walk.entity;

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
@Table(name = "walk_stats")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkStats {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions = 0;

    @Column(name = "total_distance_m", nullable = false)
    private Integer totalDistanceMeters = 0;

    @Column(name = "total_duration_s", nullable = false)
    private Integer totalDurationSeconds = 0;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    private WalkStats(
        Long userId,
        User user,
        Integer totalSessions,
        Integer totalDistanceMeters,
        Integer totalDurationSeconds,
        LocalDateTime updatedAt
    ) {
        assignUser(user);
        this.userId = userId != null ? userId : user.getId();
        this.totalSessions = totalSessions != null ? totalSessions : 0;
        this.totalDistanceMeters = totalDistanceMeters != null ? totalDistanceMeters : 0;
        this.totalDurationSeconds = totalDurationSeconds != null ? totalDurationSeconds : 0;
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public static WalkStatsBuilder builder() {
        return new WalkStatsBuilder();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
        if (user.getId() == null) {
            throw new IllegalArgumentException("user.id must not be null");
        }
        this.userId = user.getId();
    }

    public void increaseSessions(int increment) {
        this.totalSessions = Math.max(0, this.totalSessions + validateIncrement(increment));
        touch();
    }

    public void addDistance(int meters) {
        this.totalDistanceMeters = Math.max(0, this.totalDistanceMeters + validateIncrement(meters));
        touch();
    }

    public void addDuration(int seconds) {
        this.totalDurationSeconds = Math.max(0, this.totalDurationSeconds + validateIncrement(seconds));
        touch();
    }

    public void resetStats() {
        this.totalSessions = 0;
        this.totalDistanceMeters = 0;
        this.totalDurationSeconds = 0;
        touch();
    }

    private int validateIncrement(int value) {
        if (value < 0) {
            throw new IllegalArgumentException("increment must not be negative");
        }
        return value;
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public static final class WalkStatsBuilder {
        private Long userId;
        private User user;
        private Integer totalSessions;
        private Integer totalDistanceMeters;
        private Integer totalDurationSeconds;
        private LocalDateTime updatedAt;

        private WalkStatsBuilder() {
        }

        public WalkStatsBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public WalkStatsBuilder user(User user) {
            this.user = user;
            return this;
        }

        public WalkStatsBuilder totalSessions(Integer totalSessions) {
            this.totalSessions = totalSessions;
            return this;
        }

        public WalkStatsBuilder totalDistanceMeters(Integer totalDistanceMeters) {
            this.totalDistanceMeters = totalDistanceMeters;
            return this;
        }

        public WalkStatsBuilder totalDurationSeconds(Integer totalDurationSeconds) {
            this.totalDurationSeconds = totalDurationSeconds;
            return this;
        }

        public WalkStatsBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public WalkStats build() {
            Objects.requireNonNull(user, "user must not be null");
            return new WalkStats(
                userId,
                user,
                totalSessions,
                totalDistanceMeters,
                totalDurationSeconds,
                updatedAt
            );
        }
    }
}
