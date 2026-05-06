package com.qms.queue.service;

import com.qms.queue.dto.request.LoginRequest;
import com.qms.queue.dto.response.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
}