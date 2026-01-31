package kr.co.mongmate.api.auth.service;

import kr.co.mongmate.api.auth.dto.LoginRequest;
import kr.co.mongmate.api.auth.dto.LoginResponse;
import kr.co.mongmate.api.auth.service.JwtProvider;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        // 1) 사용자 조회
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new IllegalArgumentException("회원이 아닌 전화번호입니다."));

        // 2) JWT 발급
        String accessToken = jwtProvider.generateAccessToken(user.getId());
        String refreshToken = jwtProvider.generateRefreshToken(user.getId());

        return new LoginResponse(user.getId(), accessToken, refreshToken);
    }
}
