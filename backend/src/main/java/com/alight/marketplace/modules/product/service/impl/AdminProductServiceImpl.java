package com.alight.marketplace.modules.product.service.impl;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.UpdateProductStatusRequest;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.AdminProductService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminProductServiceImpl implements AdminProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponseDto> listAllProducts(
            ProductStatus status,
            UUID categoryId,
            UUID vendorId,
            String search,
            Pageable pageable
    ) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (categoryId != null) {
                Predicate directCat = cb.equal(root.get("category").get("id"), categoryId);
                Predicate parentCat = cb.equal(root.get("category").get("parent").get("id"), categoryId);
                predicates.add(cb.or(directCat, parentCat));
            }

            if (vendorId != null) {
                predicates.add(cb.equal(root.get("vendor").get("id"), vendorId));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate skuMatch = cb.like(cb.lower(root.get("sku")), pattern);
                predicates.add(cb.or(titleMatch, skuMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable)
                .map(productMapper::toResponseDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponseDto getProductById(UUID productId) {
        Product product = findProductEntity(productId);
        return productMapper.toResponseDto(product);
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.alight.marketplace.modules.audit.service.AuditLogService auditLogService;

    @Override
    @Transactional
    public ProductResponseDto updateProductStatus(UUID productId, UpdateProductStatusRequest request) {
        Product product = findProductEntity(productId);
        ProductStatus newStatus = request.getStatus();

        if (newStatus == ProductStatus.REJECTED && (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty())) {
            throw new BusinessRuleException("A rejection reason is required when rejecting a product");
        }

        product.setStatus(newStatus);
        if (newStatus == ProductStatus.REJECTED) {
            product.setRejectionReason(request.getRejectionReason().trim());
        } else {
            product.setRejectionReason(null);
        }

        Product saved = productRepository.save(product);
        log.info("Admin updated product {} status to {}", productId, newStatus);

        if (auditLogService != null) {
            auditLogService.recordEvent("PRODUCT_STATUS_UPDATED", "PRODUCT", productId.toString(),
                    "Product '" + saved.getTitle() + "' status changed to: " + newStatus +
                    (request.getRejectionReason() != null ? " (Reason: " + request.getRejectionReason() + ")" : ""));
        }

        return productMapper.toResponseDto(saved);
    }

    @Override
    @Transactional
    public ProductResponseDto toggleFeatured(UUID productId, boolean featured) {
        Product product = findProductEntity(productId);
        product.setFeatured(featured);
        Product saved = productRepository.save(product);
        log.info("Admin set product {} is_featured to {}", productId, featured);
        return productMapper.toResponseDto(saved);
    }

    private Product findProductEntity(UUID productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));
    }
}
