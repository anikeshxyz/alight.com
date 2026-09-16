package com.alight.marketplace.modules.payment.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.payment.dto.WebhookProcessResult;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.service.PaymentWebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments/webhooks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Webhooks", description = "Asynchronous webhook receiver endpoints for payment gateways")
public class PaymentWebhookController {

    private final PaymentWebhookService webhookService;

    @PostMapping("/razorpay")
    @Operation(summary = "Handle incoming Razorpay webhook events with signature validation")
    public ResponseEntity<ApiResponse<WebhookProcessResult>> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            HttpServletRequest request
    ) {
        String clientIp = request.getRemoteAddr();
        WebhookProcessResult result = webhookService.processRazorpayWebhook(payload, signature, clientIp);
        return ResponseEntity.ok(ApiResponse.success(result, "Razorpay webhook processed"));
    }

    @PostMapping("/stripe")
    @Operation(summary = "Handle incoming Stripe webhook events with signature validation")
    public ResponseEntity<ApiResponse<WebhookProcessResult>> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signature,
            HttpServletRequest request
    ) {
        String clientIp = request.getRemoteAddr();
        WebhookProcessResult result = webhookService.processStripeWebhook(payload, signature, clientIp);
        return ResponseEntity.ok(ApiResponse.success(result, "Stripe webhook processed"));
    }

    @PostMapping("/generic/{gatewayType}")
    @Operation(summary = "Handle generic webhook callbacks for offline/mock gateways")
    public ResponseEntity<ApiResponse<WebhookProcessResult>> handleGenericWebhook(
            @PathVariable PaymentGatewayType gatewayType,
            @RequestParam(required = false) String eventId,
            @RequestParam(required = false, defaultValue = "payment.success") String eventType,
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            HttpServletRequest request
    ) {
        String clientIp = request.getRemoteAddr();
        String finalEventId = (eventId != null && !eventId.isBlank()) ? eventId : "GEN-EVT-" + java.util.UUID.randomUUID();
        WebhookProcessResult result = webhookService.processGenericWebhook(gatewayType, finalEventId, eventType, payload, signature, clientIp);
        return ResponseEntity.ok(ApiResponse.success(result, "Webhook processed"));
    }
}
