package kr.co.mongmate.api.auth.service;

import kr.co.mongmate.api.sms.service.SmsSenderService;
import kr.co.mongmate.api.sms.util.SmsMessageTemplate;
import kr.co.mongmate.api.sms.util.SmsVerificationCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class SmsAuthService {

    private final SmsSenderService smsSenderService;

    // TODO: 나중에 Redis로 교체 예정
    private static final Map<String, AuthCodeInfo> store = new ConcurrentHashMap<>();
    private static final Duration EXPIRE_DURATION = Duration.ofMinutes(3);

    private static final String KEY_PREFIX = "sms:auth:";

    // Redis 사용 시
    // private final StringRedisTemplate redisTemplate;

    /**
     * 인증번호 + 문자 발송 + 임시 저장
     */
    public void sendAuthCode(String phoneNumber) {
        String code = SmsVerificationCodeGenerator.generate();
        String text = SmsMessageTemplate.verificationMessage(code);

        // 문자 발송
        smsSenderService.sendSms(phoneNumber, text);

        // ===== 임시 In-Memory 저장 =====
        String key = buildKey(phoneNumber);
        store.put(key, new AuthCodeInfo(code, Instant.now().plus(EXPIRE_DURATION)));

        // ===== Redis 버전 (나중에 사용할 예정) =====
        // ValueOperations<String, String> ops = redisTemplate.opsForValue();
        // ops.set(key, code, EXPIRE_DURATION);
    }

    /**
     * 인증번호 검증
     */
    public boolean verifyAuthCode(String phoneNumber, String inputCode) {
        String key = buildKey(phoneNumber);

        // ===== In-Memory 버전 =====
        AuthCodeInfo info = store.get(key);
        if (info == null) {
            return false; // 없음 or 이미 삭제
        }

        // 만료 체크
        if (info.expiredAt().isBefore(Instant.now())) {
            store.remove(key);
            return false;
        }

        boolean matched = info.code().equals(inputCode);
        if (matched) {
            store.remove(key);
        }
        return matched;

        // ===== Redis 버전 (추후 전환) =====
        // ValueOperations<String, String> ops = redisTemplate.opsForValue();
        // String storedCode = ops.get(key);
        // if (storedCode == null) {
        //     return false;
        // }
        // boolean matched = storedCode.equals(inputCode);
        // if (matched) {
        //     redisTemplate.delete(key);
        // }
        // return matched;
    }

    private String buildKey(String phoneNumber) {
        return KEY_PREFIX + phoneNumber;
    }

    // In-Memory용 레코드
    private record AuthCodeInfo(String code, Instant expiredAt) {}
}
