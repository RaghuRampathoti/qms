package com.qms.queue.service.ServiceImpl;

import com.qms.queue.dto.common.PageResponse;
import com.qms.queue.dto.request.CandidateRegistrationRequest;
import com.qms.queue.dto.request.UpdateCandidateRequest;
import com.qms.queue.dto.response.CandidateRegistrationResponse;
import com.qms.queue.dto.response.CandidateResponse;
import com.qms.queue.entity.Candidate;
import com.qms.queue.enums.CandidateStatus;
import com.qms.queue.entity.Token;
import com.qms.queue.enums.TokenStatus;
import com.qms.queue.exceptions.BusinessException;
import com.qms.queue.exceptions.DuplicateResourceException;
import com.qms.queue.exceptions.ResourceNotFoundException;
import com.qms.queue.repository.CandidateRepository;
import com.qms.queue.repository.TokenRepository;
import com.qms.queue.repository.FeedbackRepository;
import com.qms.queue.service.CandidateService;
import com.qms.queue.service.CloudinaryService;
import com.qms.queue.service.EmailService;
import com.qms.queue.service.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateServiceImpl implements CandidateService {

    private final CandidateRepository candidateRepository;
    private final TokenRepository tokenRepository;
    private final FeedbackRepository feedbackRepository;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final CloudinaryService cloudinaryService;

    @Value("${app.token-prefix:HYD}")
    private String tokenPrefix;

    @Value("${app.avg-interview-minutes:20}")
    private int avgInterviewMinutes;

    @Override
    @Transactional
    public CandidateRegistrationResponse register(CandidateRegistrationRequest request) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        if (candidateRepository.existsByMobileNumberAndCreatedAtAfter(request.getMobileNumber(), startOfDay)) {
            throw new DuplicateResourceException("Mobile number already registered today");
        }
        if (candidateRepository.existsByEmailAndCreatedAtAfter(request.getEmail(), startOfDay)) {
            throw new DuplicateResourceException("Email already registered today");
        }

        long sequence = tokenRepository.findMaxSequenceToday(startOfDay) + 1;
        long waitingCount = candidateRepository.countByStatusAndCreatedAtAfter(CandidateStatus.WAITING, startOfDay);
        int queuePosition = (int) waitingCount + 1;

        String tokenId = buildTokenId(sequence);

        String photoUrl = null;
        if (request.getPhoto() != null && !request.getPhoto().isEmpty()) {
            photoUrl = cloudinaryService.uploadPhoto(request.getPhoto());
        }

        String resumeUrl = null;
        if (request.getResume() != null && !request.getResume().isEmpty()) {
            resumeUrl = cloudinaryService.uploadResume(request.getResume());
        }

        Candidate candidate = Candidate.builder()
                .fullName(request.getFullName())
                .mobileNumber(request.getMobileNumber())
                .email(request.getEmail())
                .currentLocation(request.getCurrentLocation())
                .applyingPosition(request.getApplyingPosition())
                .purposeOfVisit(request.getPurposeOfVisit())
                .qualification(request.getQualification())
                .yearOfPassOut(request.getYearOfPassOut())
                .reference(request.getReference())
                .photoUrl(photoUrl)
                .resumeUrl(resumeUrl)
                .tokenId(tokenId)
                .queueNumber(queuePosition)
                .status(CandidateStatus.WAITING)
                .build();

        candidate = candidateRepository.save(candidate);

        Token token = Token.builder()
                .tokenId(tokenId)
                .sequence((int) sequence)
                .queuePosition(queuePosition)
                .candidate(candidate)
                .status(TokenStatus.WAITING)
                .build();

        tokenRepository.save(token);

        int candidatesAhead = queuePosition - 1;
        int estimatedWait = candidatesAhead * avgInterviewMinutes;

        log.info("Candidate registered: {} — token: {} — sequence: {} — queuePos: {}",
                candidate.getFullName(), tokenId, sequence, queuePosition);

        String subject = "Registration Confirmed – Your Token: " + tokenId;
        String htmlBody = emailTemplateService.buildRegistrationEmail(
                candidate.getFullName(), tokenId, queuePosition, candidatesAhead, estimatedWait);
        emailService.sendEmail(candidate.getEmail(), subject, htmlBody);
        log.info("Registration email dispatched to {}", candidate.getEmail());

        return CandidateRegistrationResponse.builder()
                .id(candidate.getId())
                .tokenId(tokenId)
                .queueNumber(queuePosition)
                .candidatesAhead(candidatesAhead)
                .estimatedWaitMinutes(estimatedWait)
                .status(CandidateStatus.WAITING.name())
                .message("Registration successful. Your token is " + tokenId)
                .build();
    }

    @Override
    public CandidateResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    public CandidateResponse getByTokenId(String tokenId) {
        Candidate c = candidateRepository.findByTokenId(tokenId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found for token: " + tokenId));
        return toResponse(c);
    }

    @Override
    public PageResponse<CandidateResponse> getAll(LocalDate date, int page, int size) {
        Page<Candidate> result;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (date != null) {
            result = candidateRepository.findByCreatedAtBetween(date.atStartOfDay(), date.atTime(23, 59, 59), pageRequest);
        } else {
            result = candidateRepository.findAll(pageRequest);
        }
        return toPageResponse(result);
    }

    @Override
    public PageResponse<CandidateResponse> getByStatus(String status, LocalDate date, int page, int size) {
        CandidateStatus cs = parseStatus(status);
        Page<Candidate> result;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("queueNumber").ascending());
        if (date != null) {
            result = candidateRepository.findByStatusAndCreatedAtBetween(cs, date.atStartOfDay(), date.atTime(23, 59, 59), pageRequest);
        } else {
            result = candidateRepository.findByStatus(cs, pageRequest);
        }
        return toPageResponse(result);
    }

    @Override
    @Transactional
    public CandidateResponse update(Long id, UpdateCandidateRequest request) {
        Candidate c = findById(id);

        if (request.getFullName() != null)
            c.setFullName(request.getFullName());
        if (request.getEmail() != null)
            c.setEmail(request.getEmail());
        if (request.getMobileNumber() != null)
            c.setMobileNumber(request.getMobileNumber());
        if (request.getCurrentLocation() != null)
            c.setCurrentLocation(request.getCurrentLocation());
        if (request.getApplyingPosition() != null)
            c.setApplyingPosition(request.getApplyingPosition());
        if (request.getPurposeOfVisit() != null)
            c.setPurposeOfVisit(request.getPurposeOfVisit());
        if (request.getStatus() != null) {
            CandidateStatus newStatus = parseStatus(request.getStatus());
            if (newStatus == CandidateStatus.IN_PROGRESS && c.getInterviewStartTime() == null) {
                c.setInterviewStartTime(LocalDateTime.now());
            }
            if (newStatus == CandidateStatus.COMPLETED && c.getInterviewEndTime() == null) {
                c.setInterviewEndTime(LocalDateTime.now());
            }
            c.setStatus(newStatus);
        }

        return toResponse(candidateRepository.save(c));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Candidate c = findById(id);
        if (c.getStatus() == CandidateStatus.IN_PROGRESS) {
            throw new BusinessException("Cannot delete a candidate currently in interview");
        }
        tokenRepository.findByCandidateId(id).ifPresent(token -> {
            feedbackRepository.findByToken(token).ifPresent(feedback -> {
                feedbackRepository.delete(feedback);
                feedbackRepository.flush();
            });
            tokenRepository.delete(token);
        });
        candidateRepository.delete(c);
    }

    @Override
    public List<CandidateResponse> getWaitingQueue() {
        return candidateRepository.findByStatusOrderByQueueNumberAsc(CandidateStatus.WAITING)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public byte[] exportToExcel(String status, LocalDate date) {
        List<Candidate> candidates;

        CandidateStatus cs = null;
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            cs = parseStatus(status);
        }

        if (date != null) {
            LocalDateTime fromDt = date.atStartOfDay();
            LocalDateTime toDt = date.atTime(23, 59, 59);
            if (cs != null) {
                candidates = candidateRepository.findByStatusAndDateRange(cs, fromDt, toDt);
            } else {
                candidates = candidateRepository.findByCreatedAtBetween(fromDt, toDt);
            }
        } else {
            if (cs != null) {
                candidates = candidateRepository.findByStatus(cs);
            } else {
                candidates = candidateRepository.findAll();
            }
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Candidates Report");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.TEAL.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] headers = { "#", "Token ID", "Full Name", "Mobile", "Email",
                    "Location", "Position", "Purpose", "Qualification", "Year of Pass Out", "Reference", "Status",
                    "Interviewer", "Interview Result",
                    "Queue No", "Interview Start", "Interview End", "Registered At" };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");
            int rowNum = 1;

            for (Candidate c : candidates) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(rowNum - 1);
                row.createCell(1).setCellValue(c.getTokenId() != null ? c.getTokenId() : "");
                row.createCell(2).setCellValue(c.getFullName());
                row.createCell(3).setCellValue(c.getMobileNumber());
                row.createCell(4).setCellValue(c.getEmail());
                row.createCell(5).setCellValue(c.getCurrentLocation() != null ? c.getCurrentLocation() : "");
                row.createCell(6).setCellValue(c.getApplyingPosition() != null ? c.getApplyingPosition() : "");
                row.createCell(7).setCellValue(c.getPurposeOfVisit() != null ? c.getPurposeOfVisit() : "");
                row.createCell(8).setCellValue(c.getQualification() != null ? c.getQualification() : "");
                row.createCell(9).setCellValue(c.getYearOfPassOut() != null ? c.getYearOfPassOut() : "");
                row.createCell(10).setCellValue(c.getReference() != null ? c.getReference() : "");
                row.createCell(11).setCellValue(c.getStatus().name());

                // Fetch feedback for interviewer and result
                var feedbackOpt = feedbackRepository.findByCandidateId(c.getId());
                row.createCell(12).setCellValue(feedbackOpt.map(f -> f.getInterviewer().getUserName()).orElse("N/A"));
                row.createCell(13).setCellValue(feedbackOpt.map(f -> f.getResult().name()).orElse("PENDING"));

                row.createCell(14).setCellValue(c.getQueueNumber() != null ? c.getQueueNumber() : 0);
                row.createCell(15)
                        .setCellValue(c.getInterviewStartTime() != null ? c.getInterviewStartTime().format(fmt) : "");
                row.createCell(16)
                        .setCellValue(c.getInterviewEndTime() != null ? c.getInterviewEndTime().format(fmt) : "");
                row.createCell(17).setCellValue(c.getCreatedAt() != null ? c.getCreatedAt().format(fmt) : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new BusinessException("Failed to generate Excel report");
        }
    }

    private Candidate findById(Long id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with id: " + id));
    }

    private CandidateStatus parseStatus(String status) {
        try {
            return CandidateStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid status: " + status);
        }
    }

    private PageResponse<CandidateResponse> toPageResponse(Page<Candidate> page) {
        return PageResponse.<CandidateResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private CandidateResponse toResponse(Candidate c) {
        return CandidateResponse.builder()
                .id(c.getId())
                .fullName(c.getFullName())
                .mobileNumber(c.getMobileNumber())
                .email(c.getEmail())
                .currentLocation(c.getCurrentLocation())
                .applyingPosition(c.getApplyingPosition())
                .purposeOfVisit(c.getPurposeOfVisit())
                .qualification(c.getQualification())
                .yearOfPassOut(c.getYearOfPassOut())
                .reference(c.getReference())
                .photoUrl(c.getPhotoUrl())
                .resumeUrl(c.getResumeUrl())
                .status(c.getStatus().name())
                .tokenId(c.getTokenId())
                .queueNumber(c.getQueueNumber())
                .interviewStartTime(c.getInterviewStartTime())
                .interviewEndTime(c.getInterviewEndTime())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private String buildTokenId(long sequence) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("%s-%s-%03d", tokenPrefix, date, sequence);
    }
}
