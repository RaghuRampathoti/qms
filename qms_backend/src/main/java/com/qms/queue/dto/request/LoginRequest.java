package com.qms.queue.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    @JsonProperty("username")
    private String username;

    @NotBlank
    private String password;
}
