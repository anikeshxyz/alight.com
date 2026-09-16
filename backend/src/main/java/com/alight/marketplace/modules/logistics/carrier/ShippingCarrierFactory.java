package com.alight.marketplace.modules.logistics.carrier;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ShippingCarrierFactory {

    private final Map<String, ShippingCarrierAdapter> adapterMap = new HashMap<>();
    private final MockLogisticsAdapter mockLogisticsAdapter;

    public ShippingCarrierFactory(List<ShippingCarrierAdapter> adapters, MockLogisticsAdapter mockLogisticsAdapter) {
        this.mockLogisticsAdapter = mockLogisticsAdapter;
        for (ShippingCarrierAdapter adapter : adapters) {
            adapterMap.put(adapter.getCarrierCode().toUpperCase(), adapter);
        }
    }

    public ShippingCarrierAdapter getAdapter(String carrierCode) {
        if (carrierCode == null || carrierCode.isBlank()) {
            return mockLogisticsAdapter;
        }
        return adapterMap.getOrDefault(carrierCode.toUpperCase(), mockLogisticsAdapter);
    }
}
