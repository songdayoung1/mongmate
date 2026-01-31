package kr.co.mongmate.domain.notification.entity;

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
    name = "push_device",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_token", columnNames = {"user_id", "device_token"})
    },
    indexes = {
        @Index(name = "idx_pd_user_active", columnList = "user_id, is_active")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PushDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false, length = 10)
    private Platform platform;

    @Column(name = "device_token", nullable = false, length = 255)
    private String deviceToken;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    private PushDevice(
        Long id,
        User user,
        Platform platform,
        String deviceToken,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
        this.id = id;
        assignUser(user);
        this.platform = Objects.requireNonNull(platform, "platform must not be null");
        this.deviceToken = Objects.requireNonNull(deviceToken, "deviceToken must not be null");
        this.active = active != null ? active : Boolean.TRUE;
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = createdAt != null ? createdAt : now;
        this.updatedAt = updatedAt != null ? updatedAt : now;
    }

    public static PushDeviceBuilder builder() {
        return new PushDeviceBuilder();
    }

    public void assignUser(User user) {
        this.user = Objects.requireNonNull(user, "user must not be null");
    }

    public void updateToken(String newToken) {
        this.deviceToken = Objects.requireNonNull(newToken, "deviceToken must not be null");
        touch();
    }

    public void activate() {
        this.active = Boolean.TRUE;
        touch();
    }

    public void deactivate() {
        this.active = Boolean.FALSE;
        touch();
    }

    public boolean isActive() {
        return Boolean.TRUE.equals(this.active);
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public static final class PushDeviceBuilder {
        private Long id;
        private User user;
        private Platform platform;
        private String deviceToken;
        private Boolean active;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private PushDeviceBuilder() {
        }

        public PushDeviceBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public PushDeviceBuilder user(User user) {
            this.user = user;
            return this;
        }

        public PushDeviceBuilder platform(Platform platform) {
            this.platform = platform;
            return this;
        }

        public PushDeviceBuilder deviceToken(String deviceToken) {
            this.deviceToken = deviceToken;
            return this;
        }

        public PushDeviceBuilder active(Boolean active) {
            this.active = active;
            return this;
        }

        public PushDeviceBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public PushDeviceBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public PushDevice build() {
            Objects.requireNonNull(user, "user must not be null");
            Objects.requireNonNull(platform, "platform must not be null");
            Objects.requireNonNull(deviceToken, "deviceToken must not be null");
            return new PushDevice(
                id,
                user,
                platform,
                deviceToken,
                active,
                createdAt,
                updatedAt
            );
        }
    }

    public enum Platform {
        IOS,
        ANDROID,
        WEB
    }
}
