package com.qms.queue.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CandidateRegistrationRequest {
    @NotBlank
    private String fullName;

    @NotBlank
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid mobile number")
    private String mobileNumber;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String currentLocation;

    @NotBlank
    private String applyingPosition;

    @NotBlank
    private String purposeOfVisit;

    @NotBlank
    private String qualification;

    @NotBlank
    private String yearOfPassOut;

    private String reference;

    private MultipartFile photo;

    private MultipartFile resume;
}
