package com.sdn.blacklist.notifications;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
public class PendingNotificationController {

    private final PendingNotificationRepository repository;

    // يجيب الإشعارات ويحددها كـ read في نفس الـ transaction
    @GetMapping("/pending")
    @Transactional
    public ResponseEntity<List<PendingNotification>> getPending(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        
        String username = auth.getName();
        List<PendingNotification> pending = 
            repository.findByUsernameAndReadFalseOrderByCreatedAtDesc(username);
        
        // حدد كـ read فوراً قبل ما نرجع — يمنع الـ double fetch
        if (!pending.isEmpty()) {
            repository.markAllReadByUsername(username);
        }
        
        return ResponseEntity.ok(pending);
    }

    @PutMapping("/pending/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        repository.markAllReadByUsername(auth.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/pending/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        repository.markReadById(id);
        return ResponseEntity.ok().build();
    }
}