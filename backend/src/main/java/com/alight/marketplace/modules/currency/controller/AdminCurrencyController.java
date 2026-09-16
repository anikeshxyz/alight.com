package com.alight.marketplace.modules.currency.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.currency.dto.CurrencyDto;
import com.alight.marketplace.modules.currency.dto.UpdateExchangeRateRequest;
import com.alight.marketplace.modules.currency.service.CurrencyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/currencies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCurrencyController {

    private final CurrencyService currencyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CurrencyDto>>> listAllCurrencies() {
        List<CurrencyDto> currencies = currencyService.listAllCurrenciesAdmin();
        return ResponseEntity.ok(ApiResponse.success(currencies, "All currencies retrieved"));
    }

    @PutMapping("/rates")
    public ResponseEntity<ApiResponse<CurrencyDto>> updateExchangeRate(
            @Valid @RequestBody UpdateExchangeRateRequest request) {
        CurrencyDto updated = currencyService.updateExchangeRate(request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Exchange rate updated successfully"));
    }

    @PutMapping("/{code}/status")
    public ResponseEntity<ApiResponse<CurrencyDto>> toggleStatus(
            @PathVariable String code,
            @RequestParam boolean active) {
        CurrencyDto updated = currencyService.toggleCurrencyStatus(code, active);
        return ResponseEntity.ok(ApiResponse.success(updated, "Currency status updated successfully"));
    }
}
