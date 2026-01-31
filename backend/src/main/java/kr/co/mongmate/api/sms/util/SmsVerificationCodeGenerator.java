package kr.co.mongmate.api.sms.util;

import java.security.SecureRandom;

public class SmsVerificationCodeGenerator {

    private static final SecureRandom random = new SecureRandom();

    // 6자리 숫자 인증번호 생성
    public static String generate() {
        int number = random.nextInt(900000) + 100000; // 100000~999999
        return String.valueOf(number);
    }
}
