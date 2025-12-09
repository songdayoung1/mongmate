package kr.co.mongmate.api.auth.service;

import kr.co.mongmate.api.auth.dto.SignUpRequest;
import kr.co.mongmate.api.auth.dto.SignUpResponse;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SignUpService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;

    @Transactional
    public SignUpResponse signUp(SignUpRequest request) {

        // 1. 기존 회원 여부 확인
        userRepository.findByPhoneNumber(request.getPhoneNumber())
                .ifPresent(u -> {
                    throw new IllegalArgumentException("이미 가입된 전화번호입니다.");
                });

        // 2. User 생성
        User user = User.builder()
                .phoneNumber(request.getPhoneNumber())
                .dateOfBirth(request.getDateOfBirth())
                .marketingAgreed(request.isMarketingAgreed())
                .termsAgreedAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);

        // 3. JWT 발급
        String accessToken = jwtProvider.generateAccessToken(saved.getId());
        String refreshToken = jwtProvider.generateRefreshToken(saved.getId());

        return new SignUpResponse(saved.getId(), accessToken, refreshToken);
    }
}
