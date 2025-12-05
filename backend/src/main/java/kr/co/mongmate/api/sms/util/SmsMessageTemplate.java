package kr.co.mongmate.api.sms.util;

public class SmsMessageTemplate {

    public static String verificationMessage(String code) {
        return "[멍메이트 인증번호]\n" +
                "인증번호는 " + code + " 입니다.\n" +
                "3분 이내에 입력해주세요.";
    }
}
