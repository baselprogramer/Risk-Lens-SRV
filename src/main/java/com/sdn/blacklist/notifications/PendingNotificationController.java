package com.sdn.blacklist.notifications;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
public class PendingNotificationController {

    private final PendingNotificationRepository repository;

    //  الموظف يجيب إشعاراته الـ unread لما يفتح
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<List<PendingNotification>> getPending(Authentication auth) {
        return ResponseEntity.ok(
            repository.findByUsernameAndReadFalseOrderByCreatedAtDesc(auth.getName())
        );
    }

    //  تحديد الكل كمقروء
    @PutMapping("/pending/read-all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        repository.markAllReadByUsername(auth.getName());
        return ResponseEntity.ok().build();
    }

    //  تحديد واحد كمقروء
    @PutMapping("/pending/{id}/read")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        repository.markReadById(id);
        return ResponseEntity.ok().build();
    }
}