package kr.co.mongmate.domain.walk.entity;

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
    name = "walk_photo",
    indexes = {
        @Index(name = "idx_wph_session", columnList = "session_id")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "photo_url", length = 255, nullable = false)
    private String photoUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private WalkPhoto(
        Long id,
        Long sessionId,
        String photoUrl,
        LocalDateTime createdAt
    ) {
        this.id = id;
        changeSession(sessionId);
        changePhotoUrl(photoUrl);
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static WalkPhotoBuilder builder() {
        return new WalkPhotoBuilder();
    }

    public void changeSession(Long sessionId) {
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId must not be null");
    }

    public void changePhotoUrl(String photoUrl) {
        this.photoUrl = Objects.requireNonNull(photoUrl, "photoUrl must not be null");
    }

    public static final class WalkPhotoBuilder {
        private Long id;
        private Long sessionId;
        private String photoUrl;
        private LocalDateTime createdAt;

        private WalkPhotoBuilder() {
        }

        public WalkPhotoBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public WalkPhotoBuilder sessionId(Long sessionId) {
            this.sessionId = sessionId;
            return this;
        }

        public WalkPhotoBuilder photoUrl(String photoUrl) {
            this.photoUrl = photoUrl;
            return this;
        }

        public WalkPhotoBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public WalkPhoto build() {
            Objects.requireNonNull(sessionId, "sessionId must not be null");
            Objects.requireNonNull(photoUrl, "photoUrl must not be null");
            return new WalkPhoto(id, sessionId, photoUrl, createdAt);
        }
    }
}
