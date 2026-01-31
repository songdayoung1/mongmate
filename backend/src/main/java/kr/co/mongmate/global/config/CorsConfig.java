package kr.co.mongmate.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // ✅ 실제 프론트 Origin 명시적으로 허용
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:8081",
                "http://127.0.0.1:8081"
        ));

        // ✅ preflight 포함 모든 메서드 허용
        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
//        // 개발용: 모든 Origin 허용 (credentials 쓰려면 allowedOriginPattern 사용)
//        config.addAllowedOriginPattern("");
//
//        // 모든 메서드 허용
//        config.addAllowedMethod("");

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