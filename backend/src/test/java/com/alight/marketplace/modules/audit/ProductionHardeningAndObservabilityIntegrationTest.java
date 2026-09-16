package com.alight.marketplace.modules.audit;

import com.alight.marketplace.modules.audit.dto.AuditLogDto;
import com.alight.marketplace.modules.audit.service.AuditLogService;
import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class ProductionHardeningAndObservabilityIntegrationTest {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "audit_admin_" + suffix + "@alight.com";

        authService.register(RegisterRequest.builder()
                .email(adminEmail)
                .password("Password123!")
                .firstName("Audit")
                .lastName("Admin")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("ADMIN")
                .build());
        adminUser = userRepository.findByEmail(adminEmail).orElseThrow();
    }

    @Test
    @DisplayName("Stage 20: Audit logging engine captures administrative and security events")
    void testAuditLogCaptureAndQuerying() {
        String resourceId = "RES-" + UUID.randomUUID().toString().substring(0, 8);

        // 1. Log administrative event
        auditLogService.log(
                adminUser.getId(),
                adminUser.getEmail(),
                "ROLE_ADMIN",
                "VENDOR_APPROVE",
                "Vendor",
                resourceId,
                "SUCCESS",
                "192.168.1.100",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Approved vendor onboarding application"
        );

        // 2. Query audit logs by action
        Page<AuditLogDto> actionLogs = auditLogService.getAuditLogs("VENDOR_APPROVE", null, null, PageRequest.of(0, 10));
        assertTrue(actionLogs.getTotalElements() >= 1);
        AuditLogDto logEntry = actionLogs.getContent().get(0);
        assertEquals("VENDOR_APPROVE", logEntry.getAction());
        assertEquals("Vendor", logEntry.getResource());
        assertEquals(adminUser.getEmail(), logEntry.getActorEmail());
        assertEquals("SUCCESS", logEntry.getResult());

        // 3. Query audit logs by resource
        Page<AuditLogDto> resourceLogs = auditLogService.getAuditLogs(null, "Vendor", null, PageRequest.of(0, 10));
        assertTrue(resourceLogs.getTotalElements() >= 1);

        // 4. Test quick event recorder
        auditLogService.recordEvent("SECURITY_CONFIG_UPDATE", "SystemConfig", "GLOBAL_SECURITY", "Updated CORS whitelist");
        Page<AuditLogDto> secLogs = auditLogService.getAuditLogs("SECURITY_CONFIG_UPDATE", null, null, PageRequest.of(0, 10));
        assertTrue(secLogs.getTotalElements() >= 1);
    }

    @Test
    @DisplayName("Stage 20: Complete production schema integrity and table existence verification")
    void testProductionDatabaseIntegrity() {
        // Verify key production tables exist and are queryable
        String[] coreTables = {
                "users", "roles", "user_roles", "vendors", "vendor_documents",
                "categories", "products", "product_variants", "inventory_items",
                "warehouses", "carts", "cart_items", "orders", "vendor_orders",
                "order_items", "payments", "shipment_packages", "tracking_events",
                "rma_requests", "rma_items", "rma_events", "coupons", "coupon_usages",
                "promotions", "reviews", "review_votes", "product_questions",
                "product_answers", "notifications", "support_tickets", "ticket_messages",
                "vendor_wallets", "wallet_transactions", "vendor_payouts",
                "tax_compliance_ledgers", "marketplace_commission_invoices", "audit_logs"
        };

        for (String table : coreTables) {
            Integer count = jdbcTemplate.queryForObject("SELECT count(*) FROM " + table, Integer.class);
            assertNotNull(count, "Table " + table + " must exist in database schema");
            assertTrue(count >= 0, "Table " + table + " must be accessible");
        }
    }
}
