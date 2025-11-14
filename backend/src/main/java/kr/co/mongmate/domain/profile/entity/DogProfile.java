package kr.co.mongmate.domain.profile.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import kr.co.mongmate.domain.user.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dog_profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DogProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guardian_user_id", nullable = false)
    private User guardianUser;

    @Column(name = "name", nullable = false, length = 30)
    private String name;

    @Column(name = "breed", length = 50)
    private String breed;

    @Column(name = "age_years")
    private Integer ageYears;

    @Column(name = "gender_code", length = 10)
    private String genderCode;

    @Column(name = "is_neutered")
    private Boolean isNeutered;

    @Column(name = "vaccination_note", length = 200)
    private String vaccinationNote;

    @Column(name = "disposition_text", length = 100)
    private String dispositionText;

    @Column(name = "photo_url", length = 255)
    private String photoUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    private DogProfile(
        Long id,
        User guardianUser,
        String name,
        String breed,
        Integer ageYears,
        String genderCode,
        Boolean isNeutered,
        String vaccinationNote,
        String dispositionText,
        String photoUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
        this.id = id;
        assignGuardian(guardianUser);
        changeName(name);
        this.breed = breed;
        this.ageYears = ageYears;
        this.genderCode = genderCode;
        this.isNeutered = isNeutered;
        this.vaccinationNote = vaccinationNote;
        this.dispositionText = dispositionText;
        this.photoUrl = photoUrl;
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = createdAt != null ? createdAt : now;
        this.updatedAt = updatedAt != null ? updatedAt : now;
    }

    public static DogProfileBuilder builder() {
        return new DogProfileBuilder();
    }

    public void assignGuardian(User guardianUser) {
        this.guardianUser = Objects.requireNonNull(guardianUser, "guardianUser must not be null");
    }

    public void changeName(String name) {
        this.name = Objects.requireNonNull(name, "name must not be null");
        touch();
    }

    public void updateBreed(String breed) {
        this.breed = breed;
        touch();
    }

    public void updateAge(Integer ageYears) {
        this.ageYears = ageYears;
        touch();
    }

    public void updateGender(String genderCode) {
        this.genderCode = genderCode;
        touch();
    }

    public void markNeutered(boolean neutered) {
        this.isNeutered = neutered;
        touch();
    }

    public void updateVaccinationNote(String vaccinationNote) {
        this.vaccinationNote = vaccinationNote;
        touch();
    }

    public void updateDisposition(String dispositionText) {
        this.dispositionText = dispositionText;
        touch();
    }

    public void updatePhoto(String photoUrl) {
        this.photoUrl = photoUrl;
        touch();
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public static final class DogProfileBuilder {
        private Long id;
        private User guardianUser;
        private String name;
        private String breed;
        private Integer ageYears;
        private String genderCode;
        private Boolean isNeutered;
        private String vaccinationNote;
        private String dispositionText;
        private String photoUrl;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private DogProfileBuilder() {
        }

        public DogProfileBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public DogProfileBuilder guardianUser(User guardianUser) {
            this.guardianUser = guardianUser;
            return this;
        }

        public DogProfileBuilder name(String name) {
            this.name = name;
            return this;
        }

        public DogProfileBuilder breed(String breed) {
            this.breed = breed;
            return this;
        }

        public DogProfileBuilder ageYears(Integer ageYears) {
            this.ageYears = ageYears;
            return this;
        }

        public DogProfileBuilder genderCode(String genderCode) {
            this.genderCode = genderCode;
            return this;
        }

        public DogProfileBuilder isNeutered(Boolean isNeutered) {
            this.isNeutered = isNeutered;
            return this;
        }

        public DogProfileBuilder vaccinationNote(String vaccinationNote) {
            this.vaccinationNote = vaccinationNote;
            return this;
        }

        public DogProfileBuilder dispositionText(String dispositionText) {
            this.dispositionText = dispositionText;
            return this;
        }

        public DogProfileBuilder photoUrl(String photoUrl) {
            this.photoUrl = photoUrl;
            return this;
        }

        public DogProfileBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public DogProfileBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public DogProfile build() {
            Objects.requireNonNull(guardianUser, "guardianUser must not be null");
            Objects.requireNonNull(name, "name must not be null");
            return new DogProfile(
                id,
                guardianUser,
                name,
                breed,
                ageYears,
                genderCode,
                isNeutered,
                vaccinationNote,
                dispositionText,
                photoUrl,
                createdAt,
                updatedAt
            );
        }
    }
}
