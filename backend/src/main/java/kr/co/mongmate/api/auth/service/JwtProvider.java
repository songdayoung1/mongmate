package kr.co.mongmate.api.auth.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    private Key key;

    @PostConstruct
    void init() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secretKey);
        } catch (IllegalArgumentException e) {
            keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(Long userId) {
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // 1시간
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setExpiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60 * 24 * 14)) // 2주
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
