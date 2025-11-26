package kr.co.mongmate.domain.meta.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "badge")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Badge {

    @Id
    @Column(name = "badge_code", length = 30, nullable = false, updatable = false)
    private String badgeCode;

    @Column(name = "display_name", length = 50, nullable = false)
    private String displayName;

    @Column(name = "description", length = 200)
    private String description;
}
