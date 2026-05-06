package com.qms.queue.controller;

import com.qms.queue.dto.common.ApiResponse;
import com.qms.queue.dto.common.PageResponse;
import com.qms.queue.dto.request.CandidateRegistrationRequest;
import com.qms.queue.dto.request.UpdateCandidateRequest;
import com.qms.queue.dto.response.CandidateRegistrationResponse;
import com.qms.queue.dto.response.CandidateResponse;
import com.qms.queue.service.CandidateService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class CandidateController {

        private final CandidateService candidateService;

        @Value("${app.frontend-url:http://localhost:5173}")
        private String frontendUrl;

        @PostMapping("/api/public/candidates/register")
        public ResponseEntity<ApiResponse<CandidateRegistrationResponse>> publicRegister(
                        @Valid @ModelAttribute CandidateRegistrationRequest request) {
                CandidateRegistrationResponse response = candidateService.register(request);
                return ResponseEntity.ok(ApiResponse.success("Registered successfully", response));
        }

        @GetMapping("/api/public/qr")
        public ResponseEntity<byte[]> getRegistrationQr() throws WriterException, IOException {
                String registrationUrl = frontendUrl + "/register";
                QRCodeWriter writer = new QRCodeWriter();
                BitMatrix matrix = writer.encode(registrationUrl, BarcodeFormat.QR_CODE, 300, 300);
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                MatrixToImageWriter.writeToStream(matrix, "PNG", out);
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"qr.png\"")
                                .contentType(MediaType.IMAGE_PNG)
                                .body(out.toByteArray());
        }

        @PostMapping("/api/candidates")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<CandidateRegistrationResponse>> adminCreate(
                        @Valid @ModelAttribute CandidateRegistrationRequest request) {
                CandidateRegistrationResponse response = candidateService.register(request);
                return ResponseEntity.ok(ApiResponse.success("Candidate added", response));
        }

        @GetMapping("/api/candidates")
        @PreAuthorize("hasAnyRole('ADMIN','INTERVIEWER')")
        public ResponseEntity<ApiResponse<PageResponse<CandidateResponse>>> getAll(
                        @RequestParam(value = "date", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date,
                        @RequestParam(value = "page", defaultValue = "0") int page,
                        @RequestParam(value = "size", defaultValue = "20") int size) {
                return ResponseEntity.ok(ApiResponse.success("Candidates fetched",
                                candidateService.getAll(date, page, size)));
        }

        @GetMapping("/api/candidates/status/{status}")
        @PreAuthorize("hasAnyRole('ADMIN','INTERVIEWER')")
        public ResponseEntity<ApiResponse<PageResponse<CandidateResponse>>> getByStatus(
                        @PathVariable("status") String status,
                        @RequestParam(value = "date", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date,
                        @RequestParam(value = "page", defaultValue = "0") int page,
                        @RequestParam(value = "size", defaultValue = "20") int size) {
                return ResponseEntity.ok(ApiResponse.success("Candidates fetched",
                                candidateService.getByStatus(status, date, page, size)));
        }

        @GetMapping("/api/candidates/queue")
        @PreAuthorize("hasAnyRole('ADMIN','INTERVIEWER')")
        public ResponseEntity<ApiResponse<List<CandidateResponse>>> getWaitingQueue() {
                return ResponseEntity.ok(ApiResponse.success("Queue fetched",
                                candidateService.getWaitingQueue()));
        }

        @GetMapping("/api/candidates/{id}")
        @PreAuthorize("hasAnyRole('ADMIN','INTERVIEWER')")
        public ResponseEntity<ApiResponse<CandidateResponse>> getById(@PathVariable Long id) {
                return ResponseEntity.ok(ApiResponse.success("Candidate fetched",
                                candidateService.getById(id)));
        }

        @GetMapping("/api/candidates/token/{tokenId}")
        @PreAuthorize("hasAnyRole('ADMIN','INTERVIEWER')")
        public ResponseEntity<ApiResponse<CandidateResponse>> getByToken(@PathVariable String tokenId) {
                return ResponseEntity.ok(ApiResponse.success("Candidate fetched",
                                candidateService.getByTokenId(tokenId)));
        }

        @PutMapping("/api/candidates/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<CandidateResponse>> update(
                        @PathVariable Long id,
                        @RequestBody UpdateCandidateRequest request) {
                return ResponseEntity.ok(ApiResponse.success("Candidate updated",
                                candidateService.update(id, request)));
        }

        @DeleteMapping("/api/candidates/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
                candidateService.delete(id);
                return ResponseEntity.ok(ApiResponse.success("Candidate deleted", null));
        }

        @GetMapping("/api/candidates/export/excel")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<byte[]> exportExcel(
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) String date) {
                LocalDate filterDate = date != null && !date.isEmpty() ? LocalDate.parse(date) : null;
                byte[] data = candidateService.exportToExcel(status, filterDate);
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=\"candidates_" + LocalDate.now() + ".xlsx\"")
                                .contentType(MediaType.parseMediaType(
                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .body(data);
        }
}
