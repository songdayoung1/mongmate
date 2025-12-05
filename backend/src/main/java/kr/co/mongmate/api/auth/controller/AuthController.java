package kr.co.mongmate.api.auth.controller;

import kr.co.mongmate.api.auth.dto.SendAuthCodeRequest;
import kr.co.mongmate.api.auth.dto.VerifyAuthCodeRequest;
import kr.co.mongmate.api.auth.dto.VerifyAuthCodeResponse;
import kr.co.mongmate.api.auth.service.SmsAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final SmsAuthService smsAuthService;

    // 1) 인증번호 보내기
    @PostMapping("/sms/send")
    public ResponseEntity<Void> send(@RequestBody SendAuthCodeRequest request) {
        smsAuthService.sendAuthCode(request.getPhoneNumber());
        return ResponseEntity.ok().build();
    }

    // 2) 인증번호 검증
    @PostMapping("/sms/verify")
    public ResponseEntity<VerifyAuthCodeResponse> verify(@RequestBody VerifyAuthCodeRequest request) {
        boolean success = smsAuthService.verifyAuthCode(
                request.getPhoneNumber(),
                request.getCode()
        );
        return ResponseEntity.ok(new VerifyAuthCodeResponse(success));
    }
}
