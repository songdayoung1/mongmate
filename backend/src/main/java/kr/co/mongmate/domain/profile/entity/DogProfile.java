package kr.co.mongmate.domain.profile.entity;

import java.time.LocalDateTime;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dog_profile")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}
