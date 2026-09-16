package com.alight.marketplace.modules.returns.service.impl;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.returns.dto.RmaPolicyDto;
import com.alight.marketplace.modules.returns.entity.RmaPolicy;
import com.alight.marketplace.modules.returns.repository.RmaPolicyRepository;
import com.alight.marketplace.modules.returns.service.RmaPolicyService;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RmaPolicyServiceImpl implements RmaPolicyService {

    private final RmaPolicyRepository policyRepository;
    private final CategoryRepository categoryRepository;
    private final VendorRepository vendorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RmaPolicyDto> getAllPolicies() {
        return policyRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RmaPolicyDto getPolicyById(UUID id) {
        RmaPolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RMA Policy not found with id: " + id));
        return mapToDto(policy);
    }

    @Override
    @Transactional(readOnly = true)
    public RmaPolicyDto getEffectivePolicy(UUID categoryId, UUID vendorId) {
        if (categoryId != null) {
            var catPolicy = policyRepository.findByCategoryId(categoryId);
            if (catPolicy.isPresent()) return mapToDto(catPolicy.get());
        }
        if (vendorId != null) {
            var venPolicy = policyRepository.findByVendorId(vendorId);
            if (venPolicy.isPresent()) return mapToDto(venPolicy.get());
        }
        return policyRepository.findDefaultPolicy()
                .map(this::mapToDto)
                .orElse(RmaPolicyDto.builder()
                        .policyName("Default Global Return Policy")
                        .returnWindowDays(15)
                        .isReturnable(true)
                        .restockingFeePercentage(java.math.BigDecimal.ZERO)
                        .requiresApproval(true)
                        .allowRefund(true)
                        .allowReplacement(true)
                        .allowStoreCredit(true)
                        .build());
    }

    @Override
    @Transactional
    public RmaPolicyDto createPolicy(RmaPolicyDto dto) {
        Category category = null;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        Vendor vendor = null;
        if (dto.getVendorId() != null) {
            vendor = vendorRepository.findById(dto.getVendorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
        }

        RmaPolicy policy = RmaPolicy.builder()
                .policyName(dto.getPolicyName())
                .category(category)
                .vendor(vendor)
                .returnWindowDays(dto.getReturnWindowDays() != null ? dto.getReturnWindowDays() : 15)
                .isReturnable(dto.getIsReturnable() != null ? dto.getIsReturnable() : true)
                .restockingFeePercentage(dto.getRestockingFeePercentage() != null ? dto.getRestockingFeePercentage() : java.math.BigDecimal.ZERO)
                .requiresApproval(dto.getRequiresApproval() != null ? dto.getRequiresApproval() : true)
                .allowRefund(dto.getAllowRefund() != null ? dto.getAllowRefund() : true)
                .allowReplacement(dto.getAllowReplacement() != null ? dto.getAllowReplacement() : true)
                .allowStoreCredit(dto.getAllowStoreCredit() != null ? dto.getAllowStoreCredit() : true)
                .termsConditions(dto.getTermsConditions())
                .build();

        return mapToDto(policyRepository.save(policy));
    }

    @Override
    @Transactional
    public RmaPolicyDto updatePolicy(UUID id, RmaPolicyDto dto) {
        RmaPolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RMA Policy not found with id: " + id));

        if (dto.getPolicyName() != null) policy.setPolicyName(dto.getPolicyName());
        if (dto.getReturnWindowDays() != null) policy.setReturnWindowDays(dto.getReturnWindowDays());
        if (dto.getIsReturnable() != null) policy.setIsReturnable(dto.getIsReturnable());
        if (dto.getRestockingFeePercentage() != null) policy.setRestockingFeePercentage(dto.getRestockingFeePercentage());
        if (dto.getRequiresApproval() != null) policy.setRequiresApproval(dto.getRequiresApproval());
        if (dto.getAllowRefund() != null) policy.setAllowRefund(dto.getAllowRefund());
        if (dto.getAllowReplacement() != null) policy.setAllowReplacement(dto.getAllowReplacement());
        if (dto.getAllowStoreCredit() != null) policy.setAllowStoreCredit(dto.getAllowStoreCredit());
        if (dto.getTermsConditions() != null) policy.setTermsConditions(dto.getTermsConditions());

        return mapToDto(policyRepository.save(policy));
    }

    @Override
    @Transactional
    public void deletePolicy(UUID id) {
        if (!policyRepository.existsById(id)) {
            throw new ResourceNotFoundException("RMA Policy not found with id: " + id);
        }
        policyRepository.deleteById(id);
    }

    private RmaPolicyDto mapToDto(RmaPolicy p) {
        return RmaPolicyDto.builder()
                .id(p.getId())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .vendorId(p.getVendor() != null ? p.getVendor().getId() : null)
                .vendorName(p.getVendor() != null ? p.getVendor().getStoreName() : null)
                .policyName(p.getPolicyName())
                .returnWindowDays(p.getReturnWindowDays())
                .isReturnable(p.getIsReturnable())
                .restockingFeePercentage(p.getRestockingFeePercentage())
                .requiresApproval(p.getRequiresApproval())
                .allowRefund(p.getAllowRefund())
                .allowReplacement(p.getAllowReplacement())
                .allowStoreCredit(p.getAllowStoreCredit())
                .termsConditions(p.getTermsConditions())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
