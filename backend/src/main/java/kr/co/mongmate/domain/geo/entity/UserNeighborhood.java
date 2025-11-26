package kr.co.mongmate.domain.geo.entity;

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
import org.hibernate.annotations.Check;

@Entity
@Table(
    name = "user_neighborhood",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_region", columnNames = {"user_id", "region_id"})
    },
    indexes = {
        @Index(name = "idx_user_active", columnList = "user_id, is_active")
    }
)
@Check(constraints = "radius_m BETWEEN 500 AND 20000")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserNeighborhood {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "region_id", nullable = false)
    private Long regionId;

    @Column(name = "radius_m", nullable = false)
    private Integer radiusMeters = 2000;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private UserNeighborhood(
        Long id,
        User user,
        Long regionId,
        Integer radiusMeters,
        Boolean active,
        LocalDateTime createdAt
    ) {
        this.id = id;
        assignUser(user);
        changeRegion(regionId);
        updateRadius(radiusMeters != null ? radiusMeters : this.radiusMeters);
        if (active != null) {
            this.active = active;
        }
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static UserNeighborhoodBuilder builder() {
        return new UserNeighborhoodBuilder();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
    }

    public void changeRegion(Long regionId) {
        this.regionId = Objects.requireNonNull(regionId, "regionId must not be null");
    }

    public void activate() {
        this.active = Boolean.TRUE;
    }

    public void deactivate() {
        this.active = Boolean.FALSE;
    }

    public void updateRadius(Integer newRadiusMeters) {
        this.radiusMeters = normalizeRadius(newRadiusMeters);
    }

    private Integer normalizeRadius(Integer candidate) {
        Objects.requireNonNull(candidate, "radiusMeters must not be null");
        if (candidate < 500 || candidate > 20000) {
            throw new IllegalArgumentException("radiusMeters must be between 500 and 20000.");
        }
        return candidate;
    }

    public static final class UserNeighborhoodBuilder {
        private Long id;
        private User user;
        private Long regionId;
        private Integer radiusMeters;
        private Boolean active;
        private LocalDateTime createdAt;

        private UserNeighborhoodBuilder() {
        }

        public UserNeighborhoodBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public UserNeighborhoodBuilder user(User user) {
            this.user = user;
            return this;
        }

        public UserNeighborhoodBuilder regionId(Long regionId) {
            this.regionId = regionId;
            return this;
        }

        public UserNeighborhoodBuilder radiusMeters(Integer radiusMeters) {
            this.radiusMeters = radiusMeters;
            return this;
        }

        public UserNeighborhoodBuilder active(Boolean active) {
            this.active = active;
            return this;
        }

        public UserNeighborhoodBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserNeighborhood build() {
            Objects.requireNonNull(user, "user must not be null");
            Objects.requireNonNull(regionId, "regionId must not be null");
            return new UserNeighborhood(id, user, regionId, radiusMeters, active, createdAt);
        }
    }
}
