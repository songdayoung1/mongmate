package kr.co.mongmate.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class VerifyAuthCodeRequest {
    private String phoneNumber;
    private String code;
}
