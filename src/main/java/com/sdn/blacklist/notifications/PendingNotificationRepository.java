package com.sdn.blacklist.notifications;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface PendingNotificationRepository extends JpaRepository<PendingNotification, Long> {

    List<PendingNotification> findByUsernameAndReadFalseOrderByCreatedAtDesc(String username);

    @Modifying
    @Transactional
    @Query("UPDATE PendingNotification n SET n.read = true WHERE n.username = :username")
    void markAllReadByUsername(String username);

    @Modifying
    @Transactional
    @Query("UPDATE PendingNotification n SET n.read = true WHERE n.id = :id")
    void markReadById(Long id);
}