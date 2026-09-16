package com.alight.marketplace.modules.currency.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.currency.dto.ConvertCurrencyRequest;
import com.alight.marketplace.modules.currency.dto.ConvertCurrencyResponse;
import com.alight.marketplace.modules.currency.dto.CurrencyDto;
import com.alight.marketplace.modules.currency.service.CurrencyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/currencies")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CurrencyDto>>> getActiveCurrencies() {
        List<CurrencyDto> currencies = currencyService.getAllActiveCurrencies();
        return ResponseEntity.ok(ApiResponse.success(currencies, "Active currencies retrieved"));
    }

    @GetMapping("/base")
    public ResponseEntity<ApiResponse<CurrencyDto>> getBaseCurrency() {
        CurrencyDto base = currencyService.getBaseCurrency();
        return ResponseEntity.ok(ApiResponse.success(base, "Base currency retrieved"));
    }

    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<CurrencyDto>> getCurrencyByCode(@PathVariable String code) {
        CurrencyDto currency = currencyService.getCurrencyByCode(code);
        return ResponseEntity.ok(ApiResponse.success(currency, "Currency details retrieved"));
    }

    @PostMapping("/convert")
    public ResponseEntity<ApiResponse<ConvertCurrencyResponse>> convertCurrency(
            @Valid @RequestBody ConvertCurrencyRequest request) {
        ConvertCurrencyResponse response = currencyService.convert(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Currency converted successfully"));
    }
}
