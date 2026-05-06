package com.qms.queue.service.ServiceImpl;

import com.qms.queue.dto.request.CreateCabinRequest;
import com.qms.queue.dto.request.UpdateCabinRequest;
import com.qms.queue.dto.response.CabinResponse;
import com.qms.queue.dto.response.UserResponse;
import com.qms.queue.entity.Cabin;
import com.qms.queue.enums.CabinStatus;
import com.qms.queue.enums.Role;
import com.qms.queue.entity.User;
import com.qms.queue.exceptions.BusinessException;
import com.qms.queue.exceptions.DuplicateResourceException;
import com.qms.queue.exceptions.ResourceNotFoundException;
import com.qms.queue.repository.CabinRepository;
import com.qms.queue.repository.TokenRepository;
import com.qms.queue.repository.UserRepository;
import com.qms.queue.service.CabinService;
import com.qms.queue.service.QueueAssignmentService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CabinServiceImpl implements CabinService {

    private final CabinRepository cabinRepository;
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final QueueAssignmentService queueAssignmentService;

    @Override
    @Transactional
    public CabinResponse create(CreateCabinRequest request) {
        if (cabinRepository.existsByCabinName(request.getCabinName())) {
            throw new DuplicateResourceException("Cabin name already exists: " + request.getCabinName());
        }

        Cabin cabin = Cabin.builder()
                .cabinName(request.getCabinName())
                .panelSize(request.getPanelSize() != null ? request.getPanelSize() : 1)
                .status(CabinStatus.INACTIVE)
                .build();

        return toResponse(cabinRepository.save(cabin));
    }

    @Override
    public CabinResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    public List<CabinResponse> getAll() {
        return cabinRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<CabinResponse> getByStatus(String status) {
        CabinStatus cs = parseCabinStatus(status);
        return cabinRepository.findByStatus(cs).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public CabinResponse update(Long id, UpdateCabinRequest request) {
        Cabin cabin = findById(id);

        if (cabin.getStatus() == CabinStatus.BUSY) {
            throw new BusinessException("Cannot edit a cabin while an interview is in progress");
        }

        if (request.getCabinName() != null && !request.getCabinName().isBlank()) {
            if (!request.getCabinName().equals(cabin.getCabinName())
                    && cabinRepository.existsByCabinName(request.getCabinName())) {
                throw new DuplicateResourceException("Cabin name already exists: " + request.getCabinName());
            }
            cabin.setCabinName(request.getCabinName());
        }

        if (request.getPanelSize() != null) {
            if (request.getPanelSize() < 1) {
                throw new BusinessException("Panel size must be at least 1");
            }

            int newSize = request.getPanelSize();
            int currentCount = cabin.getInterviewers().size();

            if (newSize < currentCount) {
                List<User> members = cabin.getInterviewers().stream().toList();
                Set<User> trimmed = new HashSet<>(members.subList(0, newSize));
                cabin.setInterviewers(trimmed);

                if (trimmed.isEmpty()) {
                    cabin.setStatus(CabinStatus.INACTIVE);
                }
            }

            cabin.setPanelSize(newSize);
        }

        if (request.getInterviewerIds() != null) {
            int effectivePanelSize = request.getPanelSize() != null
                    ? request.getPanelSize()
                    : cabin.getPanelSize();

            if (request.getInterviewerIds().size() > effectivePanelSize) {
                throw new BusinessException("Number of interviewers (" + request.getInterviewerIds().size()
                        + ") exceeds panel size (" + effectivePanelSize + ")");
            }

            Set<User> newInterviewers = request.getInterviewerIds().stream()
                    .map(this::findInterviewer)
                    .collect(Collectors.toSet());

            cabin.setInterviewers(newInterviewers);

            if (newInterviewers.isEmpty()) {
                cabin.setStatus(CabinStatus.INACTIVE);
            }
        }

        return toResponse(cabinRepository.save(cabin));
    }

    @Override
    @Transactional
    public CabinResponse activate(Long id) {
        Cabin cabin = findById(id);
        if (cabin.getStatus() == CabinStatus.BUSY) {
            throw new BusinessException("Cabin is currently busy with an interview");
        }
        cabin.setStatus(CabinStatus.ACTIVE);
        Cabin saved = cabinRepository.save(cabin);
        queueAssignmentService.handleCabinFreed(saved);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CabinResponse deactivate(Long id) {
        Cabin cabin = findById(id);
        if (cabin.getStatus() == CabinStatus.BUSY) {
            throw new BusinessException("Cannot deactivate cabin while interview is in progress");
        }
        cabin.setStatus(CabinStatus.INACTIVE);
        return toResponse(cabinRepository.save(cabin));
    }

    @Override
    @Transactional
    public CabinResponse assignInterviewer(Long cabinId, Long interviewerId) {
        Cabin cabin = findById(cabinId);
        User interviewer = findInterviewer(interviewerId);

        if (cabin.getInterviewers().size() >= cabin.getPanelSize()) {
            throw new BusinessException("Cabin panel size limit reached: " + cabin.getPanelSize());
        }

        cabin.getInterviewers().add(interviewer);
        return toResponse(cabinRepository.save(cabin));
    }

    @Override
    @Transactional
    public CabinResponse removeInterviewer(Long cabinId, Long interviewerId) {
        Cabin cabin = findById(cabinId);
        User interviewer = userRepository.findById(interviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + interviewerId));

        cabin.getInterviewers().remove(interviewer);

        if (cabin.getInterviewers().isEmpty()) {
            cabin.setStatus(CabinStatus.INACTIVE);
        }

        return toResponse(cabinRepository.save(cabin));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Cabin cabin = findById(id);
        if (cabin.getStatus() == CabinStatus.BUSY) {
            throw new BusinessException("Cannot delete a cabin that is currently in use");
        }
        cabinRepository.delete(cabin);
    }

    private Cabin findById(Long id) {
        return cabinRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cabin not found with id: " + id));
    }

    private User findInterviewer(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        if (user.getRole() != Role.INTERVIEWER) {
            throw new BusinessException("User is not an interviewer");
        }
        return user;
    }

    private CabinStatus parseCabinStatus(String status) {
        try {
            return CabinStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid cabin status: " + status);
        }
    }

    private CabinResponse toResponse(Cabin c) {
        return CabinResponse.builder()
                .id(c.getId())
                .cabinName(c.getCabinName())
                .status(c.getStatus().name())
                .panelSize(c.getPanelSize())
                .interviewers(c.getInterviewers().stream()
                        .map(u -> UserResponse.builder()
                                .id(u.getId())
                                .userName(u.getUserName())
                                .email(u.getEmail())
                                .phoneNumber(u.getPhoneNumber())
                                .role(u.getRole().name())
                                .active(u.getActive())
                                .build())
                        .toList())
                .currentCandidateId(c.getCurrentCandidate() != null ? c.getCurrentCandidate().getId() : null)
                .currentCandidateName(c.getCurrentCandidate() != null ? c.getCurrentCandidate().getFullName() : null)
                .currentCandidateToken(c.getCurrentCandidate() != null ? c.getCurrentCandidate().getTokenId() : null)
                .currentCandidateStatus(c.getCurrentCandidate() != null ? 
                        tokenRepository.findByCandidateId(c.getCurrentCandidate().getId())
                                .map(t -> t.getStatus().name()).orElse(null) : null)
                .createdAt(c.getCreatedAt())
                .build();
    }
}