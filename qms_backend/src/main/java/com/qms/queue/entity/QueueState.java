package com.qms.queue.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "queue_state")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer totalRegistered;

    @Column(nullable = false)
    private Integer totalWaiting;

    @Column(nullable = false)
    private Integer totalInProgress;

    @Column(nullable = false)
    private Integer totalCompleted;

    private String lastAnnouncement;
}