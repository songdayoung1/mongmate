package kr.co.mongmate.domain.user.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "phone_number", length = 20, nullable = false, unique = true)
    private String phoneNumber;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10)
    private Gender gender;

    @Column(name = "carrier_code", length = 20)
    private String carrierCode;

    @Column(name = "terms_agreed_at", nullable = false)
    private LocalDateTime termsAgreedAt;

    @Column(name = "marketing_agreed", nullable = false)
    private boolean marketingAgreed = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    private User(
        Long id,
        String phoneNumber,
        LocalDate dateOfBirth,
        Gender gender,
        String carrierCode,
        LocalDateTime termsAgreedAt,
        Boolean marketingAgreed,
        Status status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
        this.id = id;
        changePhoneNumber(phoneNumber);
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.carrierCode = carrierCode;
        this.termsAgreedAt = Objects.requireNonNull(termsAgreedAt, "termsAgreedAt must not be null");
        this.marketingAgreed = marketingAgreed != null && marketingAgreed;
        this.status = status != null ? status : Status.ACTIVE;
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = createdAt != null ? createdAt : now;
        this.updatedAt = updatedAt != null ? updatedAt : now;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public void changePhoneNumber(String phoneNumber) {
        this.phoneNumber = Objects.requireNonNull(phoneNumber, "phoneNumber must not be null");
        touch();
    }

    public void updateDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
        touch();
    }

    public void updateCarrierCode(String carrierCode) {
        this.carrierCode = carrierCode;
        touch();
    }

    public void updateTermsAgreement(LocalDateTime termsAgreedAt) {
        this.termsAgreedAt = Objects.requireNonNull(termsAgreedAt, "termsAgreedAt must not be null");
        touch();
    }

    public void agreeMarketing() {
        updateMarketingAgreement(true);
    }

    public void withdrawMarketingConsent() {
        updateMarketingAgreement(false);
    }

    public void updateMarketingAgreement(boolean agreed) {
        this.marketingAgreed = agreed;
        touch();
    }

    public void activate() {
        changeStatus(Status.ACTIVE);
    }

    public void block() {
        changeStatus(Status.BLOCKED);
    }

    public void markDeleted() {
        changeStatus(Status.DELETED);
    }

    public boolean isActive() {
        return this.status == Status.ACTIVE;
    }

    public void changeStatus(Status newStatus) {
        this.status = Objects.requireNonNull(newStatus, "newStatus must not be null");
        touch();
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public static final class UserBuilder {
        private Long id;
        private String phoneNumber;
        private LocalDate dateOfBirth;
        private Gender gender;
        private String carrierCode;
        private LocalDateTime termsAgreedAt;
        private Boolean marketingAgreed;
        private Status status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private UserBuilder() {
        }

        public UserBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public UserBuilder phoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        public UserBuilder dateOfBirth(LocalDate dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
            return this;
        }

        public UserBuilder gender(Gender gender) {
            this.gender = gender;
            return this;
        }

        public UserBuilder carrierCode(String carrierCode) {
            this.carrierCode = carrierCode;
            return this;
        }

        public UserBuilder termsAgreedAt(LocalDateTime termsAgreedAt) {
            this.termsAgreedAt = termsAgreedAt;
            return this;
        }

        public UserBuilder marketingAgreed(Boolean marketingAgreed) {
            this.marketingAgreed = marketingAgreed;
            return this;
        }

        public UserBuilder status(Status status) {
            this.status = status;
            return this;
        }

        public UserBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public User build() {
            Objects.requireNonNull(phoneNumber, "phoneNumber must not be null");
            Objects.requireNonNull(termsAgreedAt, "termsAgreedAt must not be null");
            return new User(
                id,
                phoneNumber,
                dateOfBirth,
                gender,
                carrierCode,
                termsAgreedAt,
                marketingAgreed,
                status,
                createdAt,
                updatedAt
            );
        }
    }

    public enum Status {
        ACTIVE,
        BLOCKED,
        DELETED
    }

    public enum Gender {
        MALE,
        FEMALE
    }

}
