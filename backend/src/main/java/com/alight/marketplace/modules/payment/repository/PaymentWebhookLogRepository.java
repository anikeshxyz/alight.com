package com.alight.marketplace.modules.payment.repository;

import com.alight.marketplace.modules.payment.entity.PaymentWebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentWebhookLogRepository extends JpaRepository<PaymentWebhookLog, UUID> {
    Optional<PaymentWebhookLog> findByEventId(String eventId);
    boolean existsByEventId(String eventId);
}
