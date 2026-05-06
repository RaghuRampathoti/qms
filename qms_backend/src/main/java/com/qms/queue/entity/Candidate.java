package com.qms.queue.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import com.qms.queue.enums.CandidateStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "candidates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String mobileNumber;

    @Column(nullable = false)
    private String email;

    private String currentLocation;

    private String applyingPosition;

    private String purposeOfVisit;

    private String qualification;

    private String yearOfPassOut;

    private String reference;

    private String photoUrl;

    private String resumeUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CandidateStatus status;

    private String tokenId;

    private Integer queueNumber;

    private LocalDateTime interviewStartTime;

    private LocalDateTime interviewEndTime;

    @CreationTimestamp
    private LocalDateTime createdAt;
}