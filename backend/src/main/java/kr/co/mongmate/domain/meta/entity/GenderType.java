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
@Table(name = "gender_type")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenderType {

    @Id
    @Column(name = "gender_code", length = 10, nullable = false, updatable = false)
    private String genderCode;

    @Column(name = "display_name", length = 20, nullable = false)
    private String displayName;
}
