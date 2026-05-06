package com.qms.queue.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @NotBlank
    @JsonProperty("userName")
    private String userName;

    @NotBlank
    @Email
    private String email;

    private String phoneNumber;

    private String currentPassword;
    private String newPassword;
}
