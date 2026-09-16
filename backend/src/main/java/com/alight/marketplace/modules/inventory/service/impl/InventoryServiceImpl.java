package com.alight.marketplace.modules.inventory.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.modules.inventory.dto.*;
import com.alight.marketplace.modules.inventory.entity.InventoryTransaction;
import com.alight.marketplace.modules.inventory.entity.TransactionType;
import com.alight.marketplace.modules.inventory.entity.Warehouse;
import com.alight.marketplace.modules.inventory.entity.WarehouseStock;
import com.alight.marketplace.modules.inventory.repository.InventoryTransactionRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository;
import com.alight.marketplace.modules.inventory.service.InventoryService;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductVariant;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceImpl implements InventoryService {

    private final WarehouseStockRepository warehouseStockRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseStockDto> getVendorInventory(String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);
        return warehouseStockRepository.findByVendorId(vendor.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseStockDto> getInventoryByWarehouse(UUID warehouseId, String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        if (warehouse.getVendor() == null || !warehouse.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Unauthorized access to warehouse stock");
        }

        return warehouseStockRepository.findByWarehouseId(warehouseId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseStockDto> getInventoryByProduct(UUID productId, String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Unauthorized access to product stock");
        }

        return warehouseStockRepository.findByProductId(productId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WarehouseStockDto adjustStock(StockAdjustmentRequest request, String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        if (warehouse.getVendor() == null || !warehouse.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Unauthorized: you cannot adjust stock for this warehouse");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Unauthorized: you cannot adjust stock for another vendor's product");
        }

        return performAdjustment(warehouse, product, request.getVariantId(), request.getTransactionType(), request.getQuantity(), request.getReferenceType(), request.getReferenceId(), request.getNotes(), user);
    }

    @Override
    @Transactional
    public void transferStock(StockTransferRequest request, String userEmail) {
        if (request.getSourceWarehouseId().equals(request.getDestinationWarehouseId())) {
            throw new BadRequestException("Source and destination warehouses must be different");
        }

        Vendor vendor = getVendorForUser(userEmail);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Warehouse srcWarehouse = warehouseRepository.findById(request.getSourceWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));
        Warehouse destWarehouse = warehouseRepository.findById(request.getDestinationWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));

        if (srcWarehouse.getVendor() == null || !srcWarehouse.getVendor().getId().equals(vendor.getId()) ||
            destWarehouse.getVendor() == null || !destWarehouse.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Unauthorized warehouse transfer");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // 1. Deduct from Source
        performAdjustment(srcWarehouse, product, request.getVariantId(), TransactionType.TRANSFER_OUT, request.getQuantity(), "TRANSFER", "TRF-OUT-" + UUID.randomUUID().toString().substring(0, 8), request.getNotes(), user);

        // 2. Add to Destination
        performAdjustment(destWarehouse, product, request.getVariantId(), TransactionType.TRANSFER_IN, request.getQuantity(), "TRANSFER", "TRF-IN-" + UUID.randomUUID().toString().substring(0, 8), request.getNotes(), user);

        log.info("Transferred {} units of product {} from {} to {}", request.getQuantity(), product.getTitle(), srcWarehouse.getCode(), destWarehouse.getCode());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseStockDto> getVendorLowStockAlerts(String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);
        return warehouseStockRepository.findLowStockAlertsByVendorId(vendor.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryTransactionDto> getVendorTransactions(String userEmail, Pageable pageable) {
        Vendor vendor = getVendorForUser(userEmail);
        return inventoryTransactionRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId(), pageable)
                .map(this::mapTxToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductStockOverviewDto getPublicProductStockOverview(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

        List<WarehouseStockDto> stocks = warehouseStockRepository.findByProductId(productId)
                .stream()
                .filter(ws -> ws.getWarehouse().isActive())
                .map(this::mapToDto)
                .collect(Collectors.toList());

        int totalAvailable;
        if (!stocks.isEmpty()) {
            totalAvailable = stocks.stream().mapToInt(WarehouseStockDto::getQuantityAvailable).sum();
        } else {
            totalAvailable = Math.max(0, product.getStockQuantity());
        }

        boolean inStock = product.getStockQuantity() > 0 && (stocks.isEmpty() || totalAvailable > 0);
        if (!inStock) {
            totalAvailable = 0;
        }
        boolean hasLowStock = inStock && stocks.stream().anyMatch(WarehouseStockDto::isLowStock);

        return ProductStockOverviewDto.builder()
                .productId(product.getId())
                .productTitle(product.getTitle())
                .productSku(product.getSku())
                .totalAvailableQuantity(totalAvailable)
                .inStock(inStock)
                .lowStock(hasLowStock)
                .warehouseBreakdown(stocks)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseStockDto> getAllInventoryAdmin() {
        return warehouseStockRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseStockDto> getAllLowStockAlertsAdmin() {
        return warehouseStockRepository.findAllLowStockAlerts()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryTransactionDto> getAllTransactionsAdmin(Pageable pageable) {
        return inventoryTransactionRepository.findAll(pageable)
                .map(this::mapTxToDto);
    }

    @Override
    @Transactional
    public WarehouseStockDto adjustStockAdmin(StockAdjustmentRequest request, String adminEmail) {
        User user = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return performAdjustment(warehouse, product, request.getVariantId(), request.getTransactionType(), request.getQuantity(), request.getReferenceType(), request.getReferenceId(), request.getNotes(), user);
    }

    private WarehouseStockDto performAdjustment(
            Warehouse warehouse,
            Product product,
            UUID variantId,
            TransactionType type,
            int quantity,
            String refType,
            String refId,
            String notes,
            User performedBy
    ) {
        if (quantity <= 0) {
            throw new BadRequestException("Quantity must be a positive integer");
        }

        ProductVariant variant = null;
        if (variantId != null) {
            variant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found"));
        }

        WarehouseStock stock = (variantId == null)
                ? warehouseStockRepository.findByWarehouseAndProductForUpdate(warehouse.getId(), product.getId())
                        .orElseGet(() -> createInitialStock(warehouse, product, null))
                : warehouseStockRepository.findByWarehouseAndProductAndVariantForUpdate(warehouse.getId(), product.getId(), variantId)
                        .orElseGet(() -> createInitialStock(warehouse, product, null));

        if (variant != null && stock.getVariant() == null) {
            stock.setVariant(variant);
        }

        int before = stock.getQuantityOnHand();
        int delta;

        switch (type) {
            case INBOUND_RECEIPT:
            case ADJUSTMENT_ADD:
            case TRANSFER_IN:
                delta = quantity;
                stock.setQuantityOnHand(before + delta);
                break;
            case OUTBOUND_SALE:
            case ADJUSTMENT_SUBTRACT:
            case DAMAGE_WRITE_OFF:
            case TRANSFER_OUT:
                delta = -quantity;
                if (before + delta < stock.getQuantityReserved()) {
                    throw new BadRequestException("Cannot reduce stock below currently reserved quantity (" + stock.getQuantityReserved() + " units reserved)");
                }
                stock.setQuantityOnHand(Math.max(0, before + delta));
                break;
            default:
                throw new BadRequestException("Unsupported manual adjustment type: " + type);
        }

        int after = stock.getQuantityOnHand();
        WarehouseStock saved = warehouseStockRepository.save(stock);

        // Record Audit Ledger
        InventoryTransaction tx = InventoryTransaction.builder()
                .warehouse(warehouse)
                .product(product)
                .variant(variant)
                .transactionType(type)
                .quantityChange(delta)
                .quantityBefore(before)
                .quantityAfter(after)
                .referenceType(refType != null ? refType : "MANUAL_ADJUSTMENT")
                .referenceId(refId)
                .notes(notes)
                .performedBy(performedBy)
                .build();
        inventoryTransactionRepository.save(tx);

        // Synchronize aggregate product stock
        syncProductAggregates(product);

        log.info("Adjusted stock for SKU: {} in warehouse {}: before={}, change={}, after={}",
                product.getSku(), warehouse.getCode(), before, delta, after);

        return mapToDto(saved);
    }

    private WarehouseStock createInitialStock(Warehouse warehouse, Product product, ProductVariant variant) {
        WarehouseStock ws = WarehouseStock.builder()
                .warehouse(warehouse)
                .product(product)
                .variant(variant)
                .quantityOnHand(0)
                .quantityReserved(0)
                .reorderThreshold(5)
                .safetyStock(2)
                .build();
        return warehouseStockRepository.save(ws);
    }

    private void syncProductAggregates(Product product) {
        int totalSum = warehouseStockRepository.sumAvailableStockByProduct(product.getId());
        product.setStockQuantity(totalSum);
        productRepository.save(product);
    }

    private Vendor getVendorForUser(String userEmail) {
        return vendorRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for email: " + userEmail));
    }

    private WarehouseStockDto mapToDto(WarehouseStock ws) {
        int avail = ws.getQuantityAvailable();
        return WarehouseStockDto.builder()
                .id(ws.getId())
                .warehouseId(ws.getWarehouse().getId())
                .warehouseName(ws.getWarehouse().getName())
                .warehouseCode(ws.getWarehouse().getCode())
                .productId(ws.getProduct().getId())
                .productTitle(ws.getProduct().getTitle())
                .productSku(ws.getProduct().getSku())
                .variantId(ws.getVariant() != null ? ws.getVariant().getId() : null)
                .variantName(ws.getVariant() != null ? ws.getVariant().getVariantName() : null)
                .variantSku(ws.getVariant() != null ? ws.getVariant().getVariantSku() : null)
                .quantityOnHand(ws.getQuantityOnHand())
                .quantityReserved(ws.getQuantityReserved())
                .quantityAvailable(avail)
                .reorderThreshold(ws.getReorderThreshold())
                .safetyStock(ws.getSafetyStock())
                .lowStock(avail <= ws.getReorderThreshold())
                .createdAt(ws.getCreatedAt())
                .updatedAt(ws.getUpdatedAt())
                .build();
    }

    private InventoryTransactionDto mapTxToDto(InventoryTransaction tx) {
        String userName = tx.getPerformedBy() != null
                ? tx.getPerformedBy().getFirstName() + " " + tx.getPerformedBy().getLastName()
                : "System Automation";

        return InventoryTransactionDto.builder()
                .id(tx.getId())
                .warehouseId(tx.getWarehouse().getId())
                .warehouseName(tx.getWarehouse().getName())
                .warehouseCode(tx.getWarehouse().getCode())
                .productId(tx.getProduct().getId())
                .productTitle(tx.getProduct().getTitle())
                .productSku(tx.getProduct().getSku())
                .variantId(tx.getVariant() != null ? tx.getVariant().getId() : null)
                .variantName(tx.getVariant() != null ? tx.getVariant().getVariantName() : null)
                .transactionType(tx.getTransactionType())
                .quantityChange(tx.getQuantityChange())
                .quantityBefore(tx.getQuantityBefore())
                .quantityAfter(tx.getQuantityAfter())
                .referenceType(tx.getReferenceType())
                .referenceId(tx.getReferenceId())
                .notes(tx.getNotes())
                .performedByName(userName)
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
