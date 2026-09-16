package com.alight.marketplace.modules.payment.gateway;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class PaymentGatewayFactory {

    private final Map<PaymentGatewayType, PaymentGatewayAdapter> adapters = new EnumMap<>(PaymentGatewayType.class);

    public PaymentGatewayFactory(List<PaymentGatewayAdapter> adapterList) {
        for (PaymentGatewayAdapter adapter : adapterList) {
            adapters.put(adapter.getGatewayType(), adapter);
        }
    }

    public PaymentGatewayAdapter getAdapter(PaymentGatewayType type) {
        PaymentGatewayAdapter adapter = adapters.get(type);
        if (adapter == null) {
            throw new BadRequestException("Unsupported payment gateway: " + type);
        }
        return adapter;
    }
}
