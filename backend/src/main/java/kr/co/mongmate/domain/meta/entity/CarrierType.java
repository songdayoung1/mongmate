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
@Table(name = "carrier_type")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarrierType {

    @Id
    @Column(name = "carrier_code", length = 20, nullable = false, updatable = false)
    private String carrierCode;

    @Column(name = "carrier_name", length = 50, nullable = false)
    private String carrierName;
}
