package com.alight.marketplace.modules.currency.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.currency.dto.ConvertCurrencyRequest;
import com.alight.marketplace.modules.currency.dto.ConvertCurrencyResponse;
import com.alight.marketplace.modules.currency.dto.CurrencyDto;
import com.alight.marketplace.modules.currency.dto.UpdateExchangeRateRequest;
import com.alight.marketplace.modules.currency.entity.Currency;
import com.alight.marketplace.modules.currency.entity.ExchangeRateHistory;
import com.alight.marketplace.modules.currency.repository.CurrencyRepository;
import com.alight.marketplace.modules.currency.repository.ExchangeRateHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CurrencyServiceImpl implements CurrencyService {

    private final CurrencyRepository currencyRepository;
    private final ExchangeRateHistoryRepository exchangeRateHistoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CurrencyDto> getAllActiveCurrencies() {
        return currencyRepository.findByIsActiveTrueOrderByCodeAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CurrencyDto> listAllCurrenciesAdmin() {
        return currencyRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CurrencyDto getBaseCurrency() {
        return currencyRepository.findByIsBaseTrue()
                .map(this::mapToDto)
                .orElseGet(() -> currencyRepository.findByCodeIgnoreCase("INR")
                        .map(this::mapToDto)
                        .orElseThrow(() -> new ResourceNotFoundException("Base currency not configured")));
    }

    @Override
    @Transactional(readOnly = true)
    public CurrencyDto getCurrencyByCode(String code) {
        if (code == null || code.isBlank()) {
            code = "INR";
        }
        final String searchCode = code.toUpperCase();
        return currencyRepository.findByCodeIgnoreCase(searchCode)
                .map(this::mapToDto)
                .orElseGet(() -> {
                    if ("INR".equalsIgnoreCase(searchCode)) {
                        return CurrencyDto.builder()
                                .code("INR")
                                .name("Indian Rupee")
                                .symbol("₹")
                                .decimalPlaces(2)
                                .isBase(true)
                                .isActive(true)
                                .exchangeRateToBase(BigDecimal.ONE)
                                .build();
                    }
                    throw new ResourceNotFoundException("Currency not found with code: " + searchCode);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public ConvertCurrencyResponse convert(ConvertCurrencyRequest request) {
        Currency fromCurr = currencyRepository.findByCodeIgnoreCase(request.getFromCurrency())
                .orElseThrow(() -> new ResourceNotFoundException("Source currency not supported: " + request.getFromCurrency()));
        Currency toCurr = currencyRepository.findByCodeIgnoreCase(request.getToCurrency())
                .orElseThrow(() -> new ResourceNotFoundException("Target currency not supported: " + request.getToCurrency()));

        BigDecimal amount = request.getAmount();
        BigDecimal convertedAmount;
        BigDecimal effectiveRate;

        if (fromCurr.getCode().equalsIgnoreCase(toCurr.getCode())) {
            convertedAmount = amount.setScale(toCurr.getDecimalPlaces(), RoundingMode.HALF_UP);
            effectiveRate = BigDecimal.ONE;
        } else {
            // Amount in base = amount / fromRate
            // Amount in target = (amount / fromRate) * toRate
            effectiveRate = toCurr.getExchangeRateToBase().divide(fromCurr.getExchangeRateToBase(), 8, RoundingMode.HALF_UP);
            convertedAmount = amount.multiply(effectiveRate).setScale(toCurr.getDecimalPlaces(), RoundingMode.HALF_UP);
        }

        String formatted = toCurr.getSymbol() + " " + convertedAmount.toPlainString();

        return ConvertCurrencyResponse.builder()
                .originalAmount(amount)
                .fromCurrency(fromCurr.getCode())
                .convertedAmount(convertedAmount)
                .toCurrency(toCurr.getCode())
                .effectiveRate(effectiveRate)
                .formattedConverted(formatted)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal convertAmount(BigDecimal amount, String fromCurrencyCode, String toCurrencyCode) {
        if (amount == null) return BigDecimal.ZERO;
        String from = fromCurrencyCode != null ? fromCurrencyCode.trim().toUpperCase() : "INR";
        String to = toCurrencyCode != null ? toCurrencyCode.trim().toUpperCase() : "INR";
        if (from.equalsIgnoreCase(to)) {
            return amount.setScale(2, RoundingMode.HALF_UP);
        }

        Currency fromCurr = currencyRepository.findByCodeIgnoreCase(from)
                .orElse(null);
        Currency toCurr = currencyRepository.findByCodeIgnoreCase(to)
                .orElse(null);

        if (fromCurr == null || toCurr == null) {
            return amount.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal effectiveRate = toCurr.getExchangeRateToBase().divide(fromCurr.getExchangeRateToBase(), 8, RoundingMode.HALF_UP);
        return amount.multiply(effectiveRate).setScale(toCurr.getDecimalPlaces(), RoundingMode.HALF_UP);
    }

    @Override
    @Transactional
    public CurrencyDto updateExchangeRate(UpdateExchangeRateRequest request) {
        Currency currency = currencyRepository.findByCodeIgnoreCase(request.getCode())
                .orElseThrow(() -> new ResourceNotFoundException("Currency not found with code: " + request.getCode()));

        if (Boolean.TRUE.equals(currency.getIsBase())) {
            throw new BadRequestException("Base currency exchange rate is fixed at 1.0");
        }

        currency.setExchangeRateToBase(request.getExchangeRate());
        Currency saved = currencyRepository.save(currency);

        ExchangeRateHistory history = ExchangeRateHistory.builder()
                .currencyCode(saved.getCode())
                .rate(request.getExchangeRate())
                .source(request.getSource() != null ? request.getSource() : "ADMIN_MANUAL")
                .build();
        exchangeRateHistoryRepository.save(history);

        log.info("Updated exchange rate for currency {} to {}", saved.getCode(), request.getExchangeRate());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public CurrencyDto toggleCurrencyStatus(String code, boolean active) {
        Currency currency = currencyRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResourceNotFoundException("Currency not found with code: " + code));

        if (Boolean.TRUE.equals(currency.getIsBase()) && !active) {
            throw new BadRequestException("Cannot disable the base platform currency");
        }

        currency.setIsActive(active);
        Currency saved = currencyRepository.save(currency);
        return mapToDto(saved);
    }

    private CurrencyDto mapToDto(Currency currency) {
        return CurrencyDto.builder()
                .id(currency.getId())
                .code(currency.getCode())
                .name(currency.getName())
                .symbol(currency.getSymbol())
                .decimalPlaces(currency.getDecimalPlaces())
                .isBase(currency.getIsBase())
                .isActive(currency.getIsActive())
                .exchangeRateToBase(currency.getExchangeRateToBase())
                .updatedAt(currency.getUpdatedAt())
                .build();
    }
}
