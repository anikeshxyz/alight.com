package com.alight.marketplace.common;

import com.alight.marketplace.common.event.*;
import com.alight.marketplace.common.exception.GlobalExceptionHandler;
import com.alight.marketplace.common.response.ApiErrorResponse;
import com.alight.marketplace.common.response.PagedResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
class ModularMonolithArchitectureIntegrationTest {

    @Autowired
    private ThreadPoolTaskExecutor alightTaskExecutor;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private GlobalExceptionHandler globalExceptionHandler;

    @Test
    @DisplayName("Should verify asynchronous task executor configuration and pool sizing")
    void testAsyncTaskExecutorConfiguration() {
        assertNotNull(alightTaskExecutor, "alightTaskExecutor bean must be active in Spring context");
        assertEquals(5, alightTaskExecutor.getCorePoolSize());
        assertEquals(25, alightTaskExecutor.getMaxPoolSize());
        assertEquals(100, alightTaskExecutor.getQueueCapacity());
        assertTrue(alightTaskExecutor.getThreadNamePrefix().startsWith("AlightAsync-"));
    }

    @Test
    @DisplayName("Should publish domain events to the asynchronous event bus without exception")
    void testDomainEventPublishing() {
        assertDoesNotThrow(() -> {
            // 1. OrderCreatedEvent
            eventPublisher.publishEvent(OrderCreatedEvent.builder()
                    .orderId(UUID.randomUUID())
                    .orderNumber("ALT-10001")
                    .customerEmail("customer@alight.com")
                    .grandTotal(new BigDecimal("15499.00"))
                    .build());

            // 2. PaymentSucceededEvent
            eventPublisher.publishEvent(PaymentSucceededEvent.builder()
                    .orderId(UUID.randomUUID())
                    .transactionId("pay_test_12345")
                    .amount(new BigDecimal("15499.00"))
                    .paymentMethod("RAZORPAY")
                    .build());

            // 3. VendorStatusChangedEvent
            eventPublisher.publishEvent(VendorStatusChangedEvent.builder()
                    .vendorId(UUID.randomUUID())
                    .storeName("Heritage Brass Works")
                    .oldStatus("PENDING_VERIFICATION")
                    .newStatus("APPROVED")
                    .build());

            // 4. StockReservedEvent
            eventPublisher.publishEvent(StockReservedEvent.builder()
                    .reservationId(UUID.randomUUID())
                    .productId(UUID.randomUUID())
                    .quantity(2)
                    .expiresAt(Instant.now().plusSeconds(900))
                    .build());
        }, "Domain events should publish smoothly to ApplicationEventPublisher");
    }

    @Test
    @DisplayName("Should verify PagedResponse wrapper mapper from Spring Data Page")
    void testPagedResponseMapping() {
        List<String> items = List.of("Product A", "Product B", "Product C");
        Page<String> page = new PageImpl<>(items, PageRequest.of(0, 10), 3);

        PagedResponse<String> pagedResponse = PagedResponse.of(page);
        assertNotNull(pagedResponse);
        assertEquals(3, pagedResponse.getContent().size());
        assertEquals(0, pagedResponse.getPage());
        assertEquals(10, pagedResponse.getSize());
        assertEquals(3, pagedResponse.getTotalElements());
        assertEquals(1, pagedResponse.getTotalPages());
        assertTrue(pagedResponse.isFirst());
        assertTrue(pagedResponse.isLast());
        assertFalse(pagedResponse.isHasNext());
    }

    @Test
    @DisplayName("Should verify GlobalExceptionHandler maps OptimisticLockingFailure to HTTP 409 Conflict")
    void testOptimisticLockingExceptionHandler() {
        ObjectOptimisticLockingFailureException ex =
                new ObjectOptimisticLockingFailureException("WarehouseStock", UUID.randomUUID());
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/v1/vendor/inventory/stock");

        ResponseEntity<ApiErrorResponse> response = globalExceptionHandler.handleOptimisticLockingFailure(ex, request);

        assertNotNull(response);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("OPTIMISTIC_LOCK_CONFLICT", response.getBody().getCode());
        assertTrue(response.getBody().getMessage().contains("modified concurrently"));
    }
}
