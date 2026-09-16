package com.alight.marketplace.modules.inventory.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.inventory.dto.StockReservationRequest;
import com.alight.marketplace.modules.inventory.dto.StockReservationResponse;
import com.alight.marketplace.modules.inventory.service.StockReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory/reservations")
@RequiredArgsConstructor
@Tag(name = "Stock Reservation Engine", description = "Atomic stock hold, confirmation, and release for checkout workflows")
public class StockReservationController {

    private final StockReservationService stockReservationService;

    @PostMapping("/hold")
    @Operation(summary = "Hold stock for checkout", description = "Atomically locks and reserves requested product quantity with a 15-minute TTL")
    public ResponseEntity<ApiResponse<StockReservationResponse>> holdStock(
            @Valid @RequestBody StockReservationRequest request,
            Authentication authentication
    ) {
        String email = (authentication != null) ? authentication.getName() : null;
        StockReservationResponse res = stockReservationService.createReservation(request, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(res, "Stock reserved successfully"));
    }

    @PostMapping("/{token}/confirm")
    @Operation(summary = "Confirm stock reservation", description = "Converts temporary reservation hold into permanent outbound sale upon successful payment")
    public ResponseEntity<ApiResponse<Void>> confirmReservation(@PathVariable String token) {
        stockReservationService.confirmReservation(token);
        return ResponseEntity.ok(ApiResponse.success(null, "Reservation confirmed successfully"));
    }

    @PostMapping("/{token}/cancel")
    @Operation(summary = "Cancel stock reservation", description = "Releases reservation hold and returns stock to available inventory immediately")
    public ResponseEntity<ApiResponse<Void>> cancelReservation(@PathVariable String token) {
        stockReservationService.cancelReservation(token);
        return ResponseEntity.ok(ApiResponse.success(null, "Reservation cancelled and stock restored"));
    }

    @GetMapping("/{token}")
    @Operation(summary = "Get reservation status", description = "Inspects status of a checkout reservation token")
    public ResponseEntity<ApiResponse<List<StockReservationResponse>>> getReservations(@PathVariable String token) {
        List<StockReservationResponse> list = stockReservationService.getReservationsByToken(token);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
