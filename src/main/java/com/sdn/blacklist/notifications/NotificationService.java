package com.sdn.blacklist.notifications;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final PendingNotificationRepository pendingRepo;

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler =
        Executors.newScheduledThreadPool(2);

    // ══════════════════════════════════════════
    //  Subscribe to SSE channel
    // ══════════════════════════════════════════
    public SseEmitter subscribe(String username) {
        SseEmitter old = emitters.remove(username);
        if (old != null) {
            try { old.complete(); } catch (Exception ignored) {}
        }

        // 30s timeout — frontend will reconnect cleanly after each cycle
        SseEmitter emitter = new SseEmitter(25 * 60 * 1000L);       
        emitters.put(username, emitter);
        log.info("✅ SSE connected: {}", username);

        // ✅ Heartbeat every 20 seconds to prevent proxy from killing connection
        ScheduledFuture<?> heartbeat = scheduler.scheduleAtFixedRate(() -> {
            SseEmitter current = emitters.get(username);
            if (current == null || current != emitter) return;
            try {
               current.send(SseEmitter.event().comment("heartbeat"));
            } catch (Exception e) {
                emitters.remove(username);
                log.warn("Heartbeat failed for {}, removing emitter", username);
            }
        }, 5, 20, TimeUnit.SECONDS);

        // ✅ Merged callbacks — no duplication
        emitter.onCompletion(() -> {
            emitters.remove(username);
            heartbeat.cancel(true);
            log.info("SSE closed for: {}", username);
        });
        emitter.onTimeout(() -> {
            emitters.remove(username);
            heartbeat.cancel(true);
            log.info("SSE timeout for: {}", username);
        });
        emitter.onError(e -> {
            emitters.remove(username);
            heartbeat.cancel(true);
            log.warn("SSE error for {}: {}", username, e.getMessage());
        });

        // Send initial ping + pending notifications after 1.5s
        scheduler.schedule(() -> {
            SseEmitter current = emitters.get(username);
            if (current == null || current != emitter) return;
            try {
                current.send(SseEmitter.event().name("ping").data("connected"));
                log.info("✅ Ping sent to: {}", username);
                deliverPending(username, emitter);
            } catch (Exception e) {
                emitters.remove(username);
                log.warn("Ping failed for {}: {}", username, e.getMessage());
            }
        }, 1500, TimeUnit.MILLISECONDS);

        return emitter;
    }

    // ══════════════════════════════════════════
    //  Deliver pending notifications on connect
    // ══════════════════════════════════════════
    private void deliverPending(String username, SseEmitter emitter) {
        var pending = pendingRepo.findByUsernameAndReadFalseOrderByCreatedAtDesc(username);
        if (pending.isEmpty()) return;

        log.info("📬 Delivering {} pending notifications to {}", pending.size(), username);
        for (PendingNotification n : pending) {
            try {
                emitter.send(SseEmitter.event()
                    .name("case-notification")
                    .data(new CaseNotification(
                        n.getCaseId(), n.getReference(), n.getSubjectName(),
                        n.getNewStatus(), n.getDecision(), n.getType(),
                        n.getDecidedBy(), n.getMessage()
                    )));
                pendingRepo.markReadById(n.getId());
            } catch (IOException e) {
                log.warn("Failed to deliver pending to {}: {}", username, e.getMessage());
                break;
            }
        }
    }

    // ══════════════════════════════════════════
    //  Send notification — save to DB if offline
    // ══════════════════════════════════════════
    public void sendToUser(String username, CaseNotification notification) {
        SseEmitter emitter = emitters.get(username);

        if (emitter == null) {
            log.info("User {} is offline — saving to pending", username);
            savePending(username, notification);
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                .name("case-notification")
                .data(notification));
            log.info("✅ Notification sent to {}: case #{}", username, notification.getCaseId());
        } catch (IOException | IllegalStateException e) {
            emitters.remove(username);
            log.warn("Emitter stale for {} — saving to pending", username);
            savePending(username, notification);
        }
    }

    private void savePending(String username, CaseNotification n) {
        try {
            pendingRepo.save(PendingNotification.builder()
                .username(username)
                .caseId(n.getCaseId())
                .reference(n.getReference())
                .subjectName(n.getSubjectName())
                .newStatus(n.getNewStatus())
                .decision(n.getDecision())
                .type(n.getType())
                .decidedBy(n.getDecidedBy())
                .message(n.getMessage())
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
        } catch (Exception e) {
            log.warn("Failed to save pending notification: {}", e.getMessage());
        }
    }

    // ══════════════════════════════════════════
    //  Notification DTO
    // ══════════════════════════════════════════
    public static class CaseNotification {
        private Long   caseId;
        private String reference;
        private String subjectName;
        private String newStatus;
        private String decision;
        private String message;
        private String type;
        private String decidedBy;
        private String timestamp;

        public CaseNotification() {}

        public CaseNotification(Long caseId, String reference, String subjectName,
                                String newStatus, String decision, String type,
                                String decidedBy, String message) {
            this.caseId      = caseId;
            this.reference   = reference;
            this.subjectName = subjectName;
            this.newStatus   = newStatus;
            this.decision    = decision;
            this.type        = type;
            this.decidedBy   = decidedBy;
            this.message     = message;
            this.timestamp   = LocalDateTime.now().toString();
        }

        public Long   getCaseId()      { return caseId;      }
        public String getReference()   { return reference;   }
        public String getSubjectName() { return subjectName; }
        public String getNewStatus()   { return newStatus;   }
        public String getDecision()    { return decision;    }
        public String getMessage()     { return message;     }
        public String getType()        { return type;        }
        public String getDecidedBy()   { return decidedBy;   }
        public String getTimestamp()   { return timestamp;   }
    }
}