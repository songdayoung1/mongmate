package kr.co.mongmate.api.auth.controller;

import kr.co.mongmate.api.auth.dto.*;
import kr.co.mongmate.api.auth.service.LoginService;
import kr.co.mongmate.api.auth.service.SignUpService;
import kr.co.mongmate.api.auth.service.SmsAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final SmsAuthService smsAuthService;
    private final SignUpService signUpService;
    private final LoginService loginService;


    /**
     * 1) 인증번호 요청 (문자 발송)
     */
    @PostMapping("/sms/send")
    public ResponseEntity<Void> send(@RequestBody SendAuthCodeRequest request) {
        log.info("🔥 SMS API HIT: {}", request.getPhoneNumber());
        smsAuthService.sendAuthCode(request.getPhoneNumber());
        return ResponseEntity.ok().build();
    }

    /**
     * 2) 인증번호 검증
     */
    @PostMapping("/sms/verify")
    public ResponseEntity<VerifyAuthCodeResponse> verify(@RequestBody VerifyAuthCodeRequest request) {
        boolean success = smsAuthService.verifyAuthCode(
                request.getPhoneNumber(),
                request.getCode()
        );
        return ResponseEntity.ok(new VerifyAuthCodeResponse(success));
    }

    /**
     * 회원 가입
     */
    @PostMapping("/signup")
    public ResponseEntity<SignUpResponse> signup(@RequestBody SignUpRequest request) {
        SignUpResponse response = signUpService.signUp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 로그인 (기존 회원 대상)
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = loginService.login(request);
        return ResponseEntity.ok(response);
    }


}
