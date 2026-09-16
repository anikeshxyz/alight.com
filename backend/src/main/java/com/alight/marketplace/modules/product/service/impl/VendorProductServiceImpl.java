package com.alight.marketplace.modules.product.service.impl;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.category.entity.Brand;
import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.category.repository.BrandRepository;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.UpdateProductRequest;
import com.alight.marketplace.modules.product.entity.*;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import com.alight.marketplace.modules.product.repository.ProductAttributeRepository;
import com.alight.marketplace.modules.product.repository.ProductImageRepository;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorProductServiceImpl implements VendorProductService {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private final ProductRepository productRepository;
    private final ProductImageRepository imageRepository;
    private final ProductAttributeRepository attributeRepository;
    private final ProductVariantRepository variantRepository;
    private final VendorRepository vendorRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductMapper productMapper;
    private final com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository warehouseStockRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponseDto> getVendorProducts(String userEmail, ProductStatus status, Pageable pageable) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        Page<Product> products = (status != null)
                ? productRepository.findByVendorIdAndStatus(vendor.getId(), status, pageable)
                : productRepository.findByVendorId(vendor.getId(), pageable);

        return products.map(productMapper::toResponseDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponseDto getVendorProductById(String userEmail, UUID productId) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        Product product = findVendorProduct(productId, vendor.getId());
        return productMapper.toResponseDto(product);
    }

    @Override
    @Transactional
    public ProductResponseDto createProduct(String userEmail, CreateProductRequest request) {
        Vendor vendor = findVendorByUserEmail(userEmail);

        if (vendor.getStatus() != VendorStatus.APPROVED && vendor.getStatus() != VendorStatus.PENDING_VERIFICATION) {
            throw new BusinessRuleException("Vendor account is not eligible to create products. Status: " + vendor.getStatus());
        }

        if (productRepository.existsBySku(request.getSku().trim())) {
            throw new DuplicateResourceException("Product with SKU already exists: " + request.getSku());
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));

        Brand brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand not found with ID: " + request.getBrandId()));
        }

        String slug = generateUniqueSlug(request.getTitle());

        Product product = Product.builder()
                .vendor(vendor)
                .category(category)
                .brand(brand)
                .title(request.getTitle().trim())
                .slug(slug)
                .shortDescription(request.getShortDescription())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .discountPrice(request.getDiscountPrice())
                .sku(request.getSku().trim().toUpperCase(Locale.ROOT))
                .stockQuantity(request.getStockQuantity())
                .lowStockThreshold(request.getLowStockThreshold() > 0 ? request.getLowStockThreshold() : 5)
                .hsnCode(request.getHsnCode() != null ? request.getHsnCode().trim() : null)
                .tags(request.getTags() != null ? request.getTags().trim() : null)
                .status(vendor.getStatus() == VendorStatus.APPROVED ? ProductStatus.PENDING_APPROVAL : ProductStatus.DRAFT)
                .featured(false)
                .build();

        // Build Gallery Images
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<ProductImage> images = new ArrayList<>();
            for (int i = 0; i < request.getImages().size(); i++) {
                var imgDto = request.getImages().get(i);
                images.add(ProductImage.builder()
                        .product(product)
                        .imageUrl(imgDto.getImageUrl().trim())
                        .altText(imgDto.getAltText() != null ? imgDto.getAltText() : request.getTitle())
                        .displayOrder(imgDto.getDisplayOrder() != 0 ? imgDto.getDisplayOrder() : i)
                        .primary(imgDto.isPrimary() || i == 0)
                        .build());
            }
            product.setImages(images);
        }

        // Build Attributes / Specs
        if (request.getAttributes() != null && !request.getAttributes().isEmpty()) {
            List<ProductAttribute> attributes = new ArrayList<>();
            for (int i = 0; i < request.getAttributes().size(); i++) {
                var attrDto = request.getAttributes().get(i);
                attributes.add(ProductAttribute.builder()
                        .product(product)
                        .attributeName(attrDto.getAttributeName().trim())
                        .attributeValue(attrDto.getAttributeValue().trim())
                        .displayOrder(attrDto.getDisplayOrder() != 0 ? attrDto.getDisplayOrder() : i)
                        .build());
            }
            product.setAttributes(attributes);
        }

        // Build SKU Variants
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            List<ProductVariant> variants = new ArrayList<>();
            for (var varDto : request.getVariants()) {
                variants.add(ProductVariant.builder()
                        .product(product)
                        .variantSku(varDto.getVariantSku() != null ? varDto.getVariantSku().trim() : (request.getSku() + "-" + variants.size()))
                        .variantName(varDto.getVariantName().trim())
                        .price(varDto.getPrice() != null ? varDto.getPrice() : request.getBasePrice())
                        .compareAtPrice(varDto.getCompareAtPrice())
                        .stockQuantity(varDto.getStockQuantity())
                        .weightGrams(varDto.getWeightGrams())
                        .barcode(varDto.getBarcode())
                        .imageUrl(varDto.getImageUrl())
                        .attributesJson(varDto.getAttributesJson())
                        .active(varDto.isActive())
                        .build());
            }
            product.setVariants(variants);
        }

        Product saved = productRepository.save(product);
        log.info("Vendor {} created product: {} with ID: {}", vendor.getStoreName(), saved.getTitle(), saved.getId());
        return productMapper.toResponseDto(saved);
    }

    @Override
    @Transactional
    public ProductResponseDto updateProduct(String userEmail, UUID productId, UpdateProductRequest request) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        Product product = findVendorProduct(productId, vendor.getId());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));

        Brand brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand not found with ID: " + request.getBrandId()));
        }

        if (!product.getTitle().equalsIgnoreCase(request.getTitle().trim())) {
            product.setTitle(request.getTitle().trim());
            product.setSlug(generateUniqueSlug(request.getTitle()));
        }

        product.setCategory(category);
        product.setBrand(brand);
        product.setShortDescription(request.getShortDescription());
        product.setDescription(request.getDescription());
        product.setBasePrice(request.getBasePrice());
        product.setDiscountPrice(request.getDiscountPrice());
        product.setStockQuantity(request.getStockQuantity());
        if (request.getStockQuantity() == 0) {
            var wsList = warehouseStockRepository.findByProductId(product.getId());
            for (var ws : wsList) {
                ws.setQuantityOnHand(0);
                ws.setQuantityReserved(0);
                warehouseStockRepository.save(ws);
            }
            if (product.getVariants() != null) {
                for (var v : product.getVariants()) {
                    v.setStockQuantity(0);
                }
            }
        }
        if (request.getLowStockThreshold() != null && request.getLowStockThreshold() > 0) {
            product.setLowStockThreshold(request.getLowStockThreshold());
        }
        product.setHsnCode(request.getHsnCode() != null ? request.getHsnCode().trim() : null);
        product.setTags(request.getTags() != null ? request.getTags().trim() : null);

        // Update Images
        product.getImages().clear();
        if (request.getImages() != null) {
            for (int i = 0; i < request.getImages().size(); i++) {
                var imgDto = request.getImages().get(i);
                product.getImages().add(ProductImage.builder()
                        .product(product)
                        .imageUrl(imgDto.getImageUrl().trim())
                        .altText(imgDto.getAltText() != null ? imgDto.getAltText() : request.getTitle())
                        .displayOrder(imgDto.getDisplayOrder() != 0 ? imgDto.getDisplayOrder() : i)
                        .primary(imgDto.isPrimary() || i == 0)
                        .build());
            }
        }

        // Update Attributes
        product.getAttributes().clear();
        if (request.getAttributes() != null) {
            for (int i = 0; i < request.getAttributes().size(); i++) {
                var attrDto = request.getAttributes().get(i);
                product.getAttributes().add(ProductAttribute.builder()
                        .product(product)
                        .attributeName(attrDto.getAttributeName().trim())
                        .attributeValue(attrDto.getAttributeValue().trim())
                        .displayOrder(attrDto.getDisplayOrder() != 0 ? attrDto.getDisplayOrder() : i)
                        .build());
            }
        }

        // Update Variants
        product.getVariants().clear();
        if (request.getVariants() != null) {
            for (var varDto : request.getVariants()) {
                product.getVariants().add(ProductVariant.builder()
                        .product(product)
                        .variantSku(varDto.getVariantSku() != null ? varDto.getVariantSku().trim() : (product.getSku() + "-" + product.getVariants().size()))
                        .variantName(varDto.getVariantName().trim())
                        .price(varDto.getPrice() != null ? varDto.getPrice() : request.getBasePrice())
                        .compareAtPrice(varDto.getCompareAtPrice())
                        .stockQuantity(varDto.getStockQuantity())
                        .weightGrams(varDto.getWeightGrams())
                        .barcode(varDto.getBarcode())
                        .imageUrl(varDto.getImageUrl())
                        .attributesJson(varDto.getAttributesJson())
                        .active(varDto.isActive())
                        .build());
            }
        }

        // Reset to review if product was rejected or active
        if (product.getStatus() == ProductStatus.REJECTED) {
            product.setStatus(ProductStatus.PENDING_APPROVAL);
            product.setRejectionReason(null);
        }

        Product saved = productRepository.save(product);
        log.info("Vendor updated product: {} (ID: {})", saved.getTitle(), saved.getId());
        return productMapper.toResponseDto(saved);
    }

    @Override
    @Transactional
    public ProductResponseDto submitProductForReview(String userEmail, UUID productId) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        Product product = findVendorProduct(productId, vendor.getId());

        if (product.getStatus() != ProductStatus.DRAFT && product.getStatus() != ProductStatus.REJECTED) {
            throw new BusinessRuleException("Only draft or rejected products can be submitted for approval");
        }

        product.setStatus(ProductStatus.PENDING_APPROVAL);
        product.setRejectionReason(null);
        Product saved = productRepository.save(product);
        log.info("Product {} submitted for admin review", productId);
        return productMapper.toResponseDto(saved);
    }

    @Override
    @Transactional
    public void deleteProduct(String userEmail, UUID productId) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        Product product = findVendorProduct(productId, vendor.getId());
        productRepository.delete(product);
        log.info("Vendor deleted product: {} (ID: {})", product.getTitle(), productId);
    }

    private Vendor findVendorByUserEmail(String email) {
        return vendorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor account not found for user: " + email));
    }

    private Product findVendorProduct(UUID productId, UUID vendorId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

        if (!product.getVendor().getId().equals(vendorId)) {
            throw new BusinessRuleException("Unauthorized access to product that does not belong to your store");
        }
        return product;
    }

    private String generateUniqueSlug(String title) {
        String nowhitespace = WHITESPACE.matcher(title).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("").toLowerCase(Locale.ENGLISH);

        if (slug.isEmpty()) {
            slug = "prod-" + UUID.randomUUID().toString().substring(0, 8);
        }

        String baseSlug = slug;
        int count = 1;
        while (productRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }
        return slug;
    }
}
