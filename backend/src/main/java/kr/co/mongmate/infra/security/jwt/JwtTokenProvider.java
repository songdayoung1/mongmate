package kr.co.mongmate.infra.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private static final String ROLES_CLAIM = "roles";

    @Value("${jwt.secret}")
    private String secret;

    private Key key;

    @PostConstruct
    void init() {
        // 1) 보편적으로는 secret을 Base64로 관리
        // 2) 혹시 plain 문자열을 쓰고 있다면 decode에서 실패하므로 fallback 처리
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException e) {
            // secret이 Base64가 아닌 경우(plain string) 대비
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    /** (1) 토큰 유효성 검증: 서명/만료/형식 */
    public void validateTokenOrThrow(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token); // 여기서 서명 + exp 검증
        } catch (ExpiredJwtException e) {
            throw new JwtException("Expired JWT token", e);
        } catch (SecurityException | MalformedJwtException e) {
            throw new JwtException("Invalid JWT signature/format", e);
        } catch (UnsupportedJwtException e) {
            throw new JwtException("Unsupported JWT token", e);
        } catch (IllegalArgumentException e) {
            throw new JwtException("JWT token is empty", e);
        }
    }

    /** (2) 토큰에서 Authentication 생성 (STOMP Principal로 쓰기 좋음) */
    public Authentication getAuthentication(String token) {
        Claims claims = parseClaims(token);

        String subject = claims.getSubject(); // 보통 userId 또는 username/email
        if (subject == null || subject.isBlank()) {
            throw new JwtException("JWT subject(sub) is missing");
        }

        List<SimpleGrantedAuthority> authorities = extractAuthorities(claims);

        // DB 조회 없이 토큰만으로 principal 구성
        User principal = new User(subject, "", authorities);

        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }

    private Claims parseClaims(String token) {
        validateTokenOrThrow(token);
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private List<SimpleGrantedAuthority> extractAuthorities(Claims claims) {
        Object rolesObj = claims.get(ROLES_CLAIM);

        if (rolesObj == null) return List.of();

        // roles: ["ROLE_USER","ROLE_ADMIN"] 형태(권장)
        if (rolesObj instanceof Collection<?> col) {
            return col.stream()
                    .map(String::valueOf)
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        }

        // roles: "ROLE_USER,ROLE_ADMIN" 문자열 형태도 대응
        String rolesStr = String.valueOf(rolesObj);
        if (rolesStr.isBlank()) return List.of();

        return Arrays.stream(rolesStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
}