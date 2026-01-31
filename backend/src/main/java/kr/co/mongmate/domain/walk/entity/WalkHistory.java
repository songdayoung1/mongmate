package kr.co.mongmate.domain.walk.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.*;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "walk_history",
        indexes = {
                @Index(name = "idx_ws_user_time", columnList = "user_id, started_at")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA 전용
public class WalkHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "dog_id")
    private Long dogId;

    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "duration_sec")
    private Integer durationSeconds;

    @Column(name = "distance_m")
    private Integer distanceMeters;

    @Column(name = "route_json", columnDefinition = "json")
    private String routeJson;

    @Column(name = "note", length = 100)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private WalkHistory(
            Long id,
            User user,
            Long dogId,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            Integer durationSeconds,
            Integer distanceMeters,
            String routeJson,
            String note,
            LocalDateTime createdAt
    ) {
        this.id = id;
        assignUser(user);
        this.dogId = dogId;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.durationSeconds = durationSeconds;
        this.distanceMeters = distanceMeters;
        this.routeJson = routeJson;
        this.note = note;
        this.createdAt = createdAt;
    }

    /**
     * WalkHistory 는 "하나의 산책 기록"이라서
     * 연관관계/컬렉션 add/remove 보다는
     * 생성 시점 빌더를 통해서만 유효한 상태로 만들도록 강제.
     */
    public static WalkHistoryBuilder builder() {
        return new WalkHistoryBuilder();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
    }

    // 필요하다면 나중에 도메인 메서드 추가 가능 (예: 종료 처리, 메모 수정 등)
    public void finish(LocalDateTime endedAt, Integer durationSeconds, Integer distanceMeters) {
        this.endedAt = endedAt;
        this.durationSeconds = durationSeconds;
        this.distanceMeters = distanceMeters;
    }

    // ==== Custom Builder ====
    public static final class WalkHistoryBuilder {
        private Long id;
        private User user;
        private Long dogId;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
        private Integer durationSeconds;
        private Integer distanceMeters;
        private String routeJson;
        private String note;
        private LocalDateTime createdAt;

        private WalkHistoryBuilder() {
        }

        public WalkHistoryBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public WalkHistoryBuilder user(User user) {
            this.user = user;
            return this;
        }

        public WalkHistoryBuilder dogId(Long dogId) {
            this.dogId = dogId;
            return this;
        }

        public WalkHistoryBuilder startedAt(LocalDateTime startedAt) {
            this.startedAt = startedAt;
            return this;
        }

        public WalkHistoryBuilder endedAt(LocalDateTime endedAt) {
            this.endedAt = endedAt;
            return this;
        }

        public WalkHistoryBuilder durationSeconds(Integer durationSeconds) {
            this.durationSeconds = durationSeconds;
            return this;
        }

        public WalkHistoryBuilder distanceMeters(Integer distanceMeters) {
            this.distanceMeters = distanceMeters;
            return this;
        }

        public WalkHistoryBuilder routeJson(String routeJson) {
            this.routeJson = routeJson;
            return this;
        }

        public WalkHistoryBuilder note(String note) {
            this.note = note;
            return this;
        }

        public WalkHistoryBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public WalkHistory build() {
            Objects.requireNonNull(user, "user must not be null");

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime effectiveStartedAt = this.startedAt != null ? this.startedAt : now;
            LocalDateTime effectiveCreatedAt = this.createdAt != null ? this.createdAt : now;

            // 간단한 도메인 검증: 종료시간이 시작시간보다 빠르면 안 됨
            if (endedAt != null && endedAt.isBefore(effectiveStartedAt)) {
                throw new IllegalArgumentException("endedAt은 startedAt보다 빠를 수 없습니다.");
            }

            if (durationSeconds != null && durationSeconds < 0) {
                throw new IllegalArgumentException("durationSeconds는 0 이상이어야 합니다.");
            }

            if (distanceMeters != null && distanceMeters < 0) {
                throw new IllegalArgumentException("distanceMeters는 0 이상이어야 합니다.");
            }

            return new WalkHistory(
                    id,
                    user,
                    dogId,
                    effectiveStartedAt,
                    endedAt,
                    durationSeconds,
                    distanceMeters,
                    routeJson,
                    note,
                    effectiveCreatedAt
            );
        }
    }
}
