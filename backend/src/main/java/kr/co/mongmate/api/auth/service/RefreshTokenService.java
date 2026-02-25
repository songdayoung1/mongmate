package kr.co.mongmate.api.auth.service;

import io.jsonwebtoken.JwtException;
import kr.co.mongmate.api.auth.dto.RefreshTokenRequest;
import kr.co.mongmate.api.auth.dto.RefreshTokenResponse;
import kr.co.mongmate.domain.user.repository.UserRepository;
import kr.co.mongmate.infra.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public RefreshTokenResponse refresh(RefreshTokenRequest request) {
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_REFRESH_TOKEN");
        }

        String token = stripBearer(request.getRefreshToken());

        String subject;
        try {
            subject = jwtTokenProvider.getSubject(token);
        } catch (JwtException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN");
        }

        Long userId = parseUserId(subject);
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN");
        }

        String newAccess = jwtProvider.generateAccessToken(userId);
        String newRefresh = jwtProvider.generateRefreshToken(userId);

        return new RefreshTokenResponse(userId, newAccess, newRefresh);
    }

    private Long parseUserId(String subject) {
        if (subject == null || subject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN");
        }
        try {
            return Long.parseLong(subject);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN");
        }
    }

    private String stripBearer(String token) {
        String t = token.trim();
        if (t.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return t.substring(7).trim();
        }
        return t;
    }
}
