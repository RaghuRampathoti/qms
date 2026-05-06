package com.qms.queue.service.ServiceImpl;

import com.qms.queue.dto.request.LoginRequest;
import com.qms.queue.dto.response.LoginResponse;
import com.qms.queue.entity.User;
import com.qms.queue.exceptions.BusinessException;
import com.qms.queue.repository.UserRepository;
import com.qms.queue.security.JwtUtil;
import com.qms.queue.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());
        User user = userRepository.findByUserName(request.getUsername())
                .orElseThrow(() -> new BusinessException("Invalid username or password"));

        if (!user.getActive()) {
            throw new BusinessException("Account is deactivated. Contact admin.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUserName(), user.getRole().name());

        return LoginResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .userName(user.getUserName())
                .id(user.getId())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .build();
    }
}