package kr.co.mongmate.domain.user.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "phone_verification",
    indexes = {
        @Index(name = "idx_pv_phone_expires", columnList = "phone_number, expires_at"),
        @Index(name = "idx_pv_verified", columnList = "verified_at")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhoneVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "phone_number", length = 20, nullable = false)
    private String phoneNumber;

    @Column(name = "code_otp", length = 10, nullable = false)
    private String codeOtp;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "try_count", nullable = false)
    private Integer tryCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private PhoneVerification(
        Long id,
        String phoneNumber,
        String codeOtp,
        LocalDateTime expiresAt,
        LocalDateTime verifiedAt,
        Integer tryCount,
        LocalDateTime createdAt
    ) {
        this.id = id;
        changePhoneNumber(phoneNumber);
        refreshCode(codeOtp, expiresAt);
        this.verifiedAt = verifiedAt;
        this.tryCount = tryCount != null ? tryCount : 0;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static PhoneVerificationBuilder builder() {
        return new PhoneVerificationBuilder();
    }

    public void changePhoneNumber(String phoneNumber) {
        this.phoneNumber = Objects.requireNonNull(phoneNumber, "phoneNumber must not be null");
    }

    public void refreshCode(String codeOtp, LocalDateTime expiresAt) {
        this.codeOtp = Objects.requireNonNull(codeOtp, "codeOtp must not be null");
        this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt must not be null");
        resetTryCount();
        markUnverified();
    }

    public void incrementTryCount() {
        this.tryCount = this.tryCount + 1;
    }

    public void resetTryCount() {
        this.tryCount = 0;
    }

    public void markVerified() {
        this.verifiedAt = LocalDateTime.now();
    }

    public void markUnverified() {
        this.verifiedAt = null;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    public boolean isVerified() {
        return this.verifiedAt != null;
    }

    public boolean matchesOtp(String inputOtp) {
        return Objects.equals(this.codeOtp, inputOtp);
    }

    public static final class PhoneVerificationBuilder {
        private Long id;
        private String phoneNumber;
        private String codeOtp;
        private LocalDateTime expiresAt;
        private LocalDateTime verifiedAt;
        private Integer tryCount;
        private LocalDateTime createdAt;

        private PhoneVerificationBuilder() {
        }

        public PhoneVerificationBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public PhoneVerificationBuilder phoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        public PhoneVerificationBuilder codeOtp(String codeOtp) {
            this.codeOtp = codeOtp;
            return this;
        }

        public PhoneVerificationBuilder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public PhoneVerificationBuilder verifiedAt(LocalDateTime verifiedAt) {
            this.verifiedAt = verifiedAt;
            return this;
        }

        public PhoneVerificationBuilder tryCount(Integer tryCount) {
            this.tryCount = tryCount;
            return this;
        }

        public PhoneVerificationBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public PhoneVerification build() {
            Objects.requireNonNull(phoneNumber, "phoneNumber must not be null");
            Objects.requireNonNull(codeOtp, "codeOtp must not be null");
            Objects.requireNonNull(expiresAt, "expiresAt must not be null");
            return new PhoneVerification(
                id,
                phoneNumber,
                codeOtp,
                expiresAt,
                verifiedAt,
                tryCount,
                createdAt
            );
        }
    }
}
