package com.sdn.blacklist.notifications;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Real-time SSE notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            SseEmitter emitter = new SseEmitter();
            emitter.completeWithError(new RuntimeException("Unauthorized"));
            return emitter;
        }

        String username = auth.getName();

        //  احتفظ بالـ SecurityContext عشان الـ async dispatch يشتغل بنفس الـ auth
        SecurityContext ctx = SecurityContextHolder.getContext();

        SseEmitter emitter = notificationService.subscribe(username);

        //  propagate الـ security context للـ async thread
        emitter.onCompletion(() -> SecurityContextHolder.clearContext());
        emitter.onTimeout(()   -> SecurityContextHolder.clearContext());

        return emitter;
    }
}