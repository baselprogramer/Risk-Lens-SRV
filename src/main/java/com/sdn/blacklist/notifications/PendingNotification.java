package com.sdn.blacklist.notifications;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pending_notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;       // المستلم

    private Long   caseId;
    private String reference;
    private String subjectName;
    private String newStatus;
    private String decision;
    private String type;           // STATUS_UPDATE | DECISION | ASSIGNED
    private String decidedBy;
    private String message;

    @Column(nullable = false)
    private Boolean read = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}