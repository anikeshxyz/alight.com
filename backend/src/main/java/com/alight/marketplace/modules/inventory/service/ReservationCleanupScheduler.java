package com.alight.marketplace.modules.inventory.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationCleanupScheduler {

    private final StockReservationService stockReservationService;

    @Scheduled(fixedRate = 60000) // Every 60 seconds
    public void cleanupExpiredReservations() {
        int released = stockReservationService.releaseExpiredReservations();
        if (released > 0) {
            log.info("ReservationCleanupScheduler: Reclaimed inventory from {} expired checkout reservations", released);
        }
    }
}
