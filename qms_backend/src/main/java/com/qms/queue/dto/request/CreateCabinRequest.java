package com.qms.queue.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCabinRequest {
    @NotBlank
    private String cabinName;
    private Integer panelSize;
}
