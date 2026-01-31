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
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

@Entity
@Table(
    name = "neighborhood_verification",
    indexes = {
        @Index(name = "idx_nv_user_valid", columnList = "user_id, is_valid, expires_at")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NeighborhoodVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "region_id", nullable = false)
    private Long regionId;

    @Column(name = "location")
    private Point location;

    @Column(name = "verified_at", nullable = false)
    private LocalDateTime verifiedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "is_valid", nullable = false)
    private Boolean valid = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private NeighborhoodVerification(
        Long id,
        User user,
        Long regionId,
        Point location,
        LocalDateTime verifiedAt,
        LocalDateTime expiresAt,
        Boolean valid,
        LocalDateTime createdAt
    ) {
        this.id = id;
        assignUser(user);
        this.regionId = Objects.requireNonNull(regionId, "regionId must not be null");
        this.location = Objects.requireNonNull(location, "location must not be null");
        this.verifiedAt = Objects.requireNonNull(verifiedAt, "verifiedAt must not be null");
        this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt must not be null");
        this.valid = valid != null ? valid : Boolean.TRUE;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static NeighborhoodVerificationBuilder builder() {
        return new NeighborhoodVerificationBuilder();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
    }

    public void markValid() {
        this.valid = Boolean.TRUE;
    }

    public void markInvalid() {
        this.valid = Boolean.FALSE;
    }

    public static final class NeighborhoodVerificationBuilder {
        private Long id;
        private User user;
        private Long regionId;
        private Point location;
        private LocalDateTime verifiedAt;
        private LocalDateTime expiresAt;
        private Boolean valid;
        private LocalDateTime createdAt;

        private NeighborhoodVerificationBuilder() {
        }

        public NeighborhoodVerificationBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public NeighborhoodVerificationBuilder user(User user) {
            this.user = user;
            return this;
        }

        public NeighborhoodVerificationBuilder regionId(Long regionId) {
            this.regionId = regionId;
            return this;
        }

        public NeighborhoodVerificationBuilder location(Point location) {
            this.location = location;
            return this;
        }

        public NeighborhoodVerificationBuilder verifiedAt(LocalDateTime verifiedAt) {
            this.verifiedAt = verifiedAt;
            return this;
        }

        public NeighborhoodVerificationBuilder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public NeighborhoodVerificationBuilder valid(Boolean valid) {
            this.valid = valid;
            return this;
        }

        public NeighborhoodVerificationBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public NeighborhoodVerification build() {
            validate();
            return new NeighborhoodVerification(
                id,
                user,
                regionId,
                location,
                verifiedAt,
                expiresAt,
                valid,
                createdAt
            );
        }

        private void validate() {
            Objects.requireNonNull(user, "user must not be null");
            Objects.requireNonNull(regionId, "regionId must not be null");
            Objects.requireNonNull(location, "location must not be null");
            Objects.requireNonNull(verifiedAt, "verifiedAt must not be null");
            Objects.requireNonNull(expiresAt, "expiresAt must not be null");
        }
    }
}
