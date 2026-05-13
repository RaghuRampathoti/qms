package com.qms.queue.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScheduleNextRoundRequest {

    @NotNull(message = "Feedback ID is required")
    private Long feedbackId;

    @NotBlank(message = "Interview date is required")
    private String interviewDate; // e.g. "2025-06-15"

    @NotBlank(message = "Interview time is required")
    private String interviewTime; // e.g. "10:30 AM"

    private String venue;         // optional location/room
    private String additionalNote; // optional note to candidate
}
