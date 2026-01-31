package kr.co.mongmate.api.sms.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.exception.NurigoMessageNotReceivedException;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SmsSenderService {

    @Value("${solapi.api-key}")
    private String apiKey;

    @Value("${solapi.api-secret}")
    private String apiSecret;

    @Value("${solapi.from-number}")
    private String fromNumber;

    private DefaultMessageService messageService;

    @PostConstruct
    public void init() {
        // "https://api.coolsms.co.kr"
        // "https://api.solapi.com"
        this.messageService =
                NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.solapi.com");
    }

    public void sendSms(String to, String text) {
        Message message = new Message();
        message.setFrom(fromNumber);
        message.setTo(to);
        message.setText(text);

        try {
            messageService.send(message);
            log.info("SMS 발송 성공: to={}, text={}", to, text);
        } catch (NurigoMessageNotReceivedException e) {
            log.error("SMS 일부 실패: {}", e.getFailedMessageList(), e);
        } catch (Exception e) {
            log.error("SMS 발송 실패: {}", e.getMessage(), e);
        }
    }
}