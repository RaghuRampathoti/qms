package com.qms.queue.config;

import com.qms.queue.entity.QueueState;
import com.qms.queue.enums.Role;
import com.qms.queue.entity.User;
import com.qms.queue.repository.QueueStateRepository;
import com.qms.queue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            QueueStateRepository queueStateRepository) {
        return args -> {
            if (userRepository.findByUserName("admin").isEmpty()) {
                userRepository.save(User.builder()
                        .userName("admin")
                        .email("admin@qms.com")
                        .password(passwordEncoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .active(true)
                        .build());
                log.info("Default admin created — admin / admin123");
            }

            if (queueStateRepository.count() == 0) {
                queueStateRepository.save(QueueState.builder()
                        .totalRegistered(0)
                        .totalWaiting(0)
                        .totalInProgress(0)
                        .totalCompleted(0)
                        .build());
                log.info("Initial queue state created");
            }
        };
    }
}
