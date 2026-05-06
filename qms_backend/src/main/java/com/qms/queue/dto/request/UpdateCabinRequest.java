package com.qms.queue.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class UpdateCabinRequest {
    private String cabinName;
    private Integer panelSize;
    private List<Long> interviewerIds;
}