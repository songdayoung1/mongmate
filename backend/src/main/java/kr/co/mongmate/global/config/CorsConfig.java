package kr.co.mongmate.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 개발용: 모든 Origin 허용 (credentials 쓰려면 allowedOriginPattern 사용)
        config.addAllowedOriginPattern("");

        // 모든 메서드 허용
        config.addAllowedMethod("");

        // 모든 헤더 허용
        config.addAllowedHeader("*");

        // 필요시 노출 헤더
        config.addExposedHeader("Authorization");

        // 쿠키/인증정보 포함 요청 허용
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}