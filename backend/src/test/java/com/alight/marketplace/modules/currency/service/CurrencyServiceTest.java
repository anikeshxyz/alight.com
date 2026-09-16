package com.alight.marketplace.modules.currency.service;

import com.alight.marketplace.modules.currency.dto.ConvertCurrencyRequest;
import com.alight.marketplace.modules.currency.dto.ConvertCurrencyResponse;
import com.alight.marketplace.modules.currency.dto.CurrencyDto;
import com.alight.marketplace.modules.currency.dto.UpdateExchangeRateRequest;
import com.alight.marketplace.modules.currency.entity.Currency;
import com.alight.marketplace.modules.currency.entity.ExchangeRateHistory;
import com.alight.marketplace.modules.currency.repository.CurrencyRepository;
import com.alight.marketplace.modules.currency.repository.ExchangeRateHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CurrencyServiceTest {

    @Mock
    private CurrencyRepository currencyRepository;

    @Mock
    private ExchangeRateHistoryRepository exchangeRateHistoryRepository;

    @InjectMocks
    private CurrencyServiceImpl currencyService;

    private Currency inr;
    private Currency usd;
    private Currency eur;

    @BeforeEach
    void setUp() {
        inr = Currency.builder()
                .id(UUID.randomUUID())
                .code("INR")
                .name("Indian Rupee")
                .symbol("₹")
                .decimalPlaces(2)
                .isBase(true)
                .isActive(true)
                .exchangeRateToBase(BigDecimal.ONE)
                .build();

        usd = Currency.builder()
                .id(UUID.randomUUID())
                .code("USD")
                .name("US Dollar")
                .symbol("$")
                .decimalPlaces(2)
                .isBase(false)
                .isActive(true)
                .exchangeRateToBase(new BigDecimal("0.012000"))
                .build();

        eur = Currency.builder()
                .id(UUID.randomUUID())
                .code("EUR")
                .name("Euro")
                .symbol("€")
                .decimalPlaces(2)
                .isBase(false)
                .isActive(true)
                .exchangeRateToBase(new BigDecimal("0.011000"))
                .build();
    }

    @Test
    @DisplayName("Should convert 1000 INR to 12 USD")
    void testConvertInrToUsd() {
        when(currencyRepository.findByCodeIgnoreCase("INR")).thenReturn(Optional.of(inr));
        when(currencyRepository.findByCodeIgnoreCase("USD")).thenReturn(Optional.of(usd));

        ConvertCurrencyRequest req = ConvertCurrencyRequest.builder()
                .amount(new BigDecimal("1000.00"))
                .fromCurrency("INR")
                .toCurrency("USD")
                .build();

        ConvertCurrencyResponse res = currencyService.convert(req);

        assertThat(res.getConvertedAmount()).isEqualByComparingTo("12.00");
        assertThat(res.getToCurrency()).isEqualTo("USD");
        assertThat(res.getFormattedConverted()).contains("$");
    }

    @Test
    @DisplayName("Should convert 12 USD to 1000 INR")
    void testConvertUsdToInr() {
        when(currencyRepository.findByCodeIgnoreCase("USD")).thenReturn(Optional.of(usd));
        when(currencyRepository.findByCodeIgnoreCase("INR")).thenReturn(Optional.of(inr));

        ConvertCurrencyRequest req = ConvertCurrencyRequest.builder()
                .amount(new BigDecimal("12.00"))
                .fromCurrency("USD")
                .toCurrency("INR")
                .build();

        ConvertCurrencyResponse res = currencyService.convert(req);

        assertThat(res.getConvertedAmount()).isEqualByComparingTo("1000.00");
    }

    @Test
    @DisplayName("Should update exchange rate and log history")
    void testUpdateExchangeRate() {
        when(currencyRepository.findByCodeIgnoreCase("USD")).thenReturn(Optional.of(usd));
        when(currencyRepository.save(any(Currency.class))).thenAnswer(i -> i.getArgument(0));

        UpdateExchangeRateRequest req = UpdateExchangeRateRequest.builder()
                .code("USD")
                .exchangeRate(new BigDecimal("0.012500"))
                .source("TEST")
                .build();

        CurrencyDto updated = currencyService.updateExchangeRate(req);

        assertThat(updated.getExchangeRateToBase()).isEqualByComparingTo("0.012500");
        verify(exchangeRateHistoryRepository, times(1)).save(any(ExchangeRateHistory.class));
    }
}
