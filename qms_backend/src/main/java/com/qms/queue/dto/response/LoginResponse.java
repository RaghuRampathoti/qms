package com.qms.queue.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String token;
    private String role;
    private String userName;
    private Long id;
    private String email;
    private String phoneNumber;
}