package com.qms.queue.service;

import com.qms.queue.dto.common.PageResponse;
import com.qms.queue.dto.request.CandidateRegistrationRequest;
import com.qms.queue.dto.request.UpdateCandidateRequest;
import com.qms.queue.dto.response.CandidateRegistrationResponse;
import com.qms.queue.dto.response.CandidateResponse;

import java.time.LocalDate;
import java.util.List;

public interface CandidateService {
    CandidateRegistrationResponse register(CandidateRegistrationRequest request);

    CandidateResponse getById(Long id);

    CandidateResponse getByTokenId(String tokenId);

    PageResponse<CandidateResponse> getAll(LocalDate date, int page, int size);

    PageResponse<CandidateResponse> getByStatus(String status, LocalDate date, int page, int size);

    CandidateResponse update(Long id, UpdateCandidateRequest request);

    void delete(Long id);

    List<CandidateResponse> getWaitingQueue();

    byte[] exportToExcel(String status, LocalDate date);
}
