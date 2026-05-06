package com.qms.queue.service.ServiceImpl;

import com.qms.queue.dto.request.CreateUserRequest;
import com.qms.queue.dto.request.UpdateUserRequest;
import com.qms.queue.dto.response.UserResponse;
import com.qms.queue.enums.Role;
import com.qms.queue.entity.User;
import com.qms.queue.exceptions.DuplicateResourceException;
import com.qms.queue.exceptions.ResourceNotFoundException;
import com.qms.queue.repository.UserRepository;
import com.qms.queue.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.qms.queue.repository.CabinRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CabinRepository cabinRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByUserName(request.getUserName())) {
            throw new DuplicateResourceException("Username already exists: " + request.getUserName());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        if (request.getRole() == null || request.getRole().isBlank()) {
            throw new IllegalArgumentException("Role is required");
        }

        User user = User.builder()
                .userName(request.getUserName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.valueOf(request.getRole().trim().toUpperCase()))
                .active(true)
                .build();

        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = findById(id);

        userRepository.findByUserName(request.getUserName())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new DuplicateResourceException("Username already exists: " + request.getUserName());
                    }
                });

        userRepository.findByEmail(request.getEmail())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new DuplicateResourceException("Email already exists: " + request.getEmail());
                    }
                });

        user.setUserName(request.getUserName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String username, com.qms.queue.dto.request.UpdateProfileRequest request) {
        User user = userRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        userRepository.findByUserName(request.getUserName())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(user.getId())) {
                        throw new DuplicateResourceException("Username already exists: " + request.getUserName());
                    }
                });

        userRepository.findByEmail(request.getEmail())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(user.getId())) {
                        throw new DuplicateResourceException("Email already exists: " + request.getEmail());
                    }
                });

        if (request.getCurrentPassword() != null && !request.getCurrentPassword().isBlank()) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Incorrect current password");
            }
            if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            }
        }

        user.setUserName(request.getUserName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());

        return toResponse(userRepository.save(user));
    }

    @Override
    public UserResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    public UserResponse getByUsername(String username) {
        User user = userRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return toResponse(user);
    }

    @Override
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<UserResponse> getInterviewers() {
        return userRepository.findByRole(Role.INTERVIEWER).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public UserResponse toggleActive(Long id) {
        User user = findById(id);
        boolean newStatus = !user.getActive();
        user.setActive(newStatus);
        
        if (!newStatus && user.getRole() == Role.INTERVIEWER) {
            List<com.qms.queue.entity.Cabin> userCabins = cabinRepository.findByInterviewersContaining(user);
            for (com.qms.queue.entity.Cabin cabin : userCabins) {
                cabin.getInterviewers().remove(user);
                cabin.setStatus(com.qms.queue.enums.CabinStatus.INACTIVE);
                cabinRepository.save(cabin);
            }
        }
        
        return toResponse(userRepository.save(user));
    }

    @Override
    public void delete(Long id) {
        User user = findById(id);
        userRepository.delete(user);
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .userName(u.getUserName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .role(u.getRole().name())
                .active(u.getActive())
                .build();
    }
}
