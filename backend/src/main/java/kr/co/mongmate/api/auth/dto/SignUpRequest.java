package kr.co.mongmate.api.auth.dto;

import kr.co.mongmate.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SignUpRequest {
    private String name;
    private LocalDate dateOfBirth;
    private User.Gender gender;
    private String phoneNumber;
    private boolean marketingAgreed; // 새로 추가!
}
