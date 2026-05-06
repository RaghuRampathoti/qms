package com.qms.queue.controller;

import com.qms.queue.dto.request.CreateCabinRequest;
import com.qms.queue.dto.request.UpdateCabinRequest;
import com.qms.queue.dto.response.CabinResponse;
import com.qms.queue.service.CabinService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cabins")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CabinController {

    private final CabinService cabinService;

    @PostMapping
    public ResponseEntity<CabinResponse> create(@RequestBody CreateCabinRequest request) {
        return ResponseEntity.ok(cabinService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<CabinResponse>> getAll() {
        return ResponseEntity.ok(cabinService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CabinResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(cabinService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CabinResponse> update(@PathVariable Long id, @RequestBody UpdateCabinRequest request) {
        return ResponseEntity.ok(cabinService.update(id, request));
    }

    @PatchMapping("/{id}/assign/{interviewerId}")
    public ResponseEntity<CabinResponse> assignInterviewer(
            @PathVariable Long id, 
            @PathVariable Long interviewerId) {
        return ResponseEntity.ok(cabinService.assignInterviewer(id, interviewerId));
    }
 
    @PatchMapping("/{id}/remove/{interviewerId}")
    public ResponseEntity<CabinResponse> removeInterviewer(
            @PathVariable Long id, 
            @PathVariable Long interviewerId) {
        return ResponseEntity.ok(cabinService.removeInterviewer(id, interviewerId));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<CabinResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(cabinService.activate(id));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<CabinResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(cabinService.deactivate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cabinService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
