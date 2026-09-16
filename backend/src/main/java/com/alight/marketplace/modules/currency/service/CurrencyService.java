package com.alight.marketplace.modules.currency.service;

import com.alight.marketplace.modules.currency.dto.ConvertCurrencyRequest;
import com.alight.marketplace.modules.currency.dto.ConvertCurrencyResponse;
import com.alight.marketplace.modules.currency.dto.CurrencyDto;
import com.alight.marketplace.modules.currency.dto.UpdateExchangeRateRequest;

import java.math.BigDecimal;
import java.util.List;

public interface CurrencyService {
    List<CurrencyDto> getAllActiveCurrencies();
    List<CurrencyDto> listAllCurrenciesAdmin();
    CurrencyDto getBaseCurrency();
    CurrencyDto getCurrencyByCode(String code);
    ConvertCurrencyResponse convert(ConvertCurrencyRequest request);
    BigDecimal convertAmount(BigDecimal amount, String fromCurrencyCode, String toCurrencyCode);
    CurrencyDto updateExchangeRate(UpdateExchangeRateRequest request);
    CurrencyDto toggleCurrencyStatus(String code, boolean active);
}
