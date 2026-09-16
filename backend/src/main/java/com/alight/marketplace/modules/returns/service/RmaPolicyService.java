package com.alight.marketplace.modules.returns.service;

import com.alight.marketplace.modules.returns.dto.RmaPolicyDto;

import java.util.List;
import java.util.UUID;

public interface RmaPolicyService {

    List<RmaPolicyDto> getAllPolicies();

    RmaPolicyDto getPolicyById(UUID id);

    RmaPolicyDto getEffectivePolicy(UUID categoryId, UUID vendorId);

    RmaPolicyDto createPolicy(RmaPolicyDto dto);

    RmaPolicyDto updatePolicy(UUID id, RmaPolicyDto dto);

    void deletePolicy(UUID id);
}
