package com.qms.queue.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeedbackRequest {
    @NotNull
    private String tokenId;

    @NotNull
    private String result;

    @Min(1)
    @Max(5)
    private Integer rating;

    private String comments;

    private String strengths;

    private String improvements;
}
