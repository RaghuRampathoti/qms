package com.qms.queue.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import com.qms.queue.enums.CabinStatus;

import java.time.LocalDateTime;
 
@Entity
@Table(name = "cabins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cabin {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(nullable = false, unique = true)
    private String cabinName;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CabinStatus status;
 
    @Column(nullable = false)
    @Builder.Default
    private Integer panelSize = 1;

    @ManyToMany(fetch = FetchType.LAZY)
    @Builder.Default
    @JoinTable(
        name = "cabin_interviewers",
        joinColumns = @JoinColumn(name = "cabin_id"),
        inverseJoinColumns = @JoinColumn(name = "interviewer_id")
    )
    private java.util.Set<User> interviewers = new java.util.HashSet<>();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_candidate_id")
    private Candidate currentCandidate;
 
    @CreationTimestamp
    private LocalDateTime createdAt;
}
