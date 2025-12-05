package kr.co.mongmate.api.auth.controller;


import kr.co.mongmate.api.sms.service.SmsSenderService;
import kr.co.mongmate.api.sms.util.SmsMessageTemplate;
import kr.co.mongmate.api.sms.util.SmsVerificationCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sms")
public class AuthController {

    private final SmsSenderService smsSenderService;

    @GetMapping("/send")
    public String send(@RequestParam String to) {

        // 1) 인증번호 생성
        String code = SmsVerificationCodeGenerator.generate();

        // 2) 발송할 메시지 구성
        String text = SmsMessageTemplate.verificationMessage(code);

        // 3) SMS 전송
        smsSenderService.sendSms(to, text);

        // TODO: 인증번호 저장 로직 (Redis 등) — 추후 추가 가능
        return "인증번호 발송 완료";
    }

}
