package kr.co.mongmate.domain.walk.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "walk_stats")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalkStats {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions = 0;

    @Builder.Default
    @Column(name = "total_distance_m", nullable = false)
    private Integer totalDistanceMeters = 0;

    @Builder.Default
    @Column(name = "total_duration_s", nullable = false)
    private Integer totalDurationSeconds = 0;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
