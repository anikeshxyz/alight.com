package com.alight.marketplace.modules.tax.service;

import com.alight.marketplace.modules.tax.dto.TaxCalculationRequest;
import com.alight.marketplace.modules.tax.dto.TaxCalculationResponse;

public interface TaxCalculationService {
    TaxCalculationResponse calculateTax(TaxCalculationRequest request);
}
