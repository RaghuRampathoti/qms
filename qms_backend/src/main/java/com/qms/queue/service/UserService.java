package com.qms.queue.service;

import com.qms.queue.dto.request.CreateUserRequest;
import com.qms.queue.dto.request.UpdateUserRequest;
import com.qms.queue.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse create(CreateUserRequest request);

    UserResponse update(Long id, UpdateUserRequest request);

    UserResponse updateProfile(String username, com.qms.queue.dto.request.UpdateProfileRequest request);

    UserResponse getById(Long id);

    UserResponse getByUsername(String username);

    List<UserResponse> getAll();

    List<UserResponse> getInterviewers();

    UserResponse toggleActive(Long id);

    void delete(Long id);
}
