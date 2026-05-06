package com.qms.queue.service;

import com.qms.queue.dto.request.CreateCabinRequest;
import com.qms.queue.dto.request.UpdateCabinRequest;
import com.qms.queue.dto.response.CabinResponse;

import java.util.List;

public interface CabinService {
    CabinResponse create(CreateCabinRequest request);

    CabinResponse getById(Long id);

    List<CabinResponse> getAll();

    List<CabinResponse> getByStatus(String status);

    CabinResponse update(Long id, UpdateCabinRequest request);

    CabinResponse activate(Long id);

    CabinResponse deactivate(Long id);

    CabinResponse assignInterviewer(Long cabinId, Long interviewerId);

    CabinResponse removeInterviewer(Long cabinId, Long interviewerId);

    void delete(Long id);
}
