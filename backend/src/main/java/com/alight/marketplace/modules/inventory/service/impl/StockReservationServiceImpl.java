package com.alight.marketplace.modules.inventory.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.inventory.dto.StockReservationRequest;
import com.alight.marketplace.modules.inventory.dto.StockReservationResponse;
import com.alight.marketplace.modules.inventory.entity.*;
import com.alight.marketplace.modules.inventory.repository.InventoryTransactionRepository;
import com.alight.marketplace.modules.inventory.repository.StockReservationRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository;
import com.alight.marketplace.modules.inventory.service.StockReservationService;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductVariant;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockReservationServiceImpl implements StockReservationService {

    private final StockReservationRepository stockReservationRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final UserRepository userRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public StockReservationResponse createReservation(StockReservationRequest request, String userEmail) {
        User user = (userEmail != null) ? userRepository.findByEmail(userEmail).orElse(null) : null;

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        final ProductVariant variant = (request.getVariantId() != null)
                ? productVariantRepository.findById(request.getVariantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"))
                : null;

        Warehouse warehouse;
        if (request.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        } else {
            // Find active warehouse with adequate available stock
            List<WarehouseStock> availableStocks = warehouseStockRepository.findByProductId(product.getId()).stream()
                    .filter(s -> s.getVariant() == null || (variant != null && s.getVariant().getId().equals(variant.getId())))
                    .collect(Collectors.toList());

            WarehouseStock bestMatch = availableStocks.stream()
                    .filter(s -> s.getWarehouse().isActive())
                    .filter(s -> s.getQuantityAvailable() >= request.getQuantity())
                    .max((a, b) -> Integer.compare(a.getQuantityAvailable(), b.getQuantityAvailable()))
                    .orElse(null);

            if (bestMatch == null) {
                throw new BadRequestException("Insufficient available stock for product: " + product.getTitle() +
                        (variant != null ? " (" + variant.getVariantName() + ")" : "") +
                        ". Requested: " + request.getQuantity() + ".");
            }

            warehouse = bestMatch.getWarehouse();
        }

        // Lock row for update
        WarehouseStock stock = (variant != null)
                ? warehouseStockRepository.findByWarehouseAndProductAndVariantForUpdate(warehouse.getId(), product.getId(), variant.getId())
                        .orElseGet(() -> warehouseStockRepository.findByWarehouseAndProductForUpdate(warehouse.getId(), product.getId()).orElse(null))
                : warehouseStockRepository.findByWarehouseAndProductForUpdate(warehouse.getId(), product.getId()).orElse(null);

        if (stock == null) {
            stock = warehouseStockRepository.findByProductId(product.getId()).stream().findFirst().orElse(null);
        }

        if (stock == null) {
            throw new BadRequestException("No inventory record in warehouse " + warehouse.getCode());
        }

        if (stock.getQuantityAvailable() < request.getQuantity()) {
            throw new BadRequestException("Requested quantity (" + request.getQuantity() + ") exceeds available stock (" + stock.getQuantityAvailable() + ") for product: " + product.getTitle());
        }

        // Reserve stock
        stock.setQuantityReserved(stock.getQuantityReserved() + request.getQuantity());
        warehouseStockRepository.save(stock);

        int ttl = Math.min(60, Math.max(5, request.getTtlMinutes()));
        String token = (request.getReservationToken() != null && !request.getReservationToken().isBlank())
                ? request.getReservationToken().trim()
                : "RES-" + UUID.randomUUID().toString();

        StockReservation reservation = StockReservation.builder()
                .reservationToken(token)
                .user(user)
                .warehouse(warehouse)
                .product(product)
                .variant(variant)
                .reservedQuantity(request.getQuantity())
                .status(ReservationStatus.PENDING)
                .expiresAt(Instant.now().plus(Duration.ofMinutes(ttl)))
                .build();

        StockReservation saved = stockReservationRepository.save(reservation);

        // Audit hold
        InventoryTransaction tx = InventoryTransaction.builder()
                .warehouse(warehouse)
                .product(product)
                .variant(variant)
                .transactionType(TransactionType.RESERVATION_HOLD)
                .quantityChange(request.getQuantity())
                .quantityBefore(stock.getQuantityOnHand())
                .quantityAfter(stock.getQuantityOnHand())
                .referenceType("CHECKOUT_RESERVATION")
                .referenceId(token)
                .notes("Temporary checkout hold for " + request.getQuantity() + " units (Expires in " + ttl + " mins)")
                .performedBy(user)
                .build();
        inventoryTransactionRepository.save(tx);

        eventPublisher.publishEvent(com.alight.marketplace.common.event.StockReservedEvent.builder()
                .reservationId(saved.getId())
                .productId(product.getId())
                .variantId(variant != null ? variant.getId() : null)
                .quantity(request.getQuantity())
                .expiresAt(saved.getExpiresAt())
                .build());

        log.info("Created stock reservation [{}] for product {} (Qty: {}) in warehouse {}",
                token, product.getSku(), request.getQuantity(), warehouse.getCode());

        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void confirmReservation(String reservationToken) {
        if (reservationToken == null || reservationToken.isBlank()) {
            return;
        }

        List<StockReservation> reservations = stockReservationRepository.findByReservationToken(reservationToken);
        if (reservations.isEmpty()) {
            log.debug("No active reservations found for token: {}", reservationToken);
            return;
        }

        for (StockReservation res : reservations) {
            if (res.getStatus() == ReservationStatus.PENDING) {
                WarehouseStock stock = (res.getVariant() != null)
                        ? warehouseStockRepository.findByWarehouseAndProductAndVariantForUpdate(res.getWarehouse().getId(), res.getProduct().getId(), res.getVariant().getId())
                                .orElseGet(() -> warehouseStockRepository.findByWarehouseAndProductForUpdate(res.getWarehouse().getId(), res.getProduct().getId()).orElse(null))
                        : warehouseStockRepository.findByWarehouseAndProductForUpdate(res.getWarehouse().getId(), res.getProduct().getId()).orElse(null);

                if (stock != null) {
                    int before = stock.getQuantityOnHand();
                    int qty = res.getReservedQuantity();

                    stock.setQuantityOnHand(Math.max(0, stock.getQuantityOnHand() - qty));
                    stock.setQuantityReserved(Math.max(0, stock.getQuantityReserved() - qty));
                    warehouseStockRepository.save(stock);

                    // Update product total stock quantity & variant stock quantity
                    if (res.getProduct() != null) {
                        Product prod = res.getProduct();
                        prod.setStockQuantity(Math.max(0, prod.getStockQuantity() - qty));
                        productRepository.save(prod);
                    }
                    if (res.getVariant() != null) {
                        ProductVariant v = res.getVariant();
                        v.setStockQuantity(Math.max(0, v.getStockQuantity() - qty));
                        productVariantRepository.save(v);
                    }

                    // Audit permanent sale deduction
                    InventoryTransaction tx = InventoryTransaction.builder()
                            .warehouse(res.getWarehouse())
                            .product(res.getProduct())
                            .variant(res.getVariant())
                            .transactionType(TransactionType.OUTBOUND_SALE)
                            .quantityChange(-qty)
                            .quantityBefore(before)
                            .quantityAfter(stock.getQuantityOnHand())
                            .referenceType("ORDER_CONFIRMATION")
                            .referenceId(reservationToken)
                            .notes("Confirmed checkout sale from reservation " + reservationToken)
                            .performedBy(res.getUser())
                            .build();
                    inventoryTransactionRepository.save(tx);
                }

                res.setStatus(ReservationStatus.CONFIRMED);
                stockReservationRepository.save(res);
            }
        }
        log.info("Confirmed all stock reservations for token: {}", reservationToken);
    }

    @Override
    @Transactional
    public void cancelReservation(String reservationToken) {
        List<StockReservation> reservations = stockReservationRepository.findByReservationToken(reservationToken);
        for (StockReservation res : reservations) {
            if (res.getStatus() == ReservationStatus.PENDING) {
                releaseReservationHold(res, ReservationStatus.CANCELLED, "Customer checkout abandoned/cancelled");
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockReservationResponse> getReservationsByToken(String reservationToken) {
        return stockReservationRepository.findByReservationToken(reservationToken)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public int releaseExpiredReservations() {
        List<StockReservation> expired = stockReservationRepository.findExpiredPendingReservations(Instant.now());
        if (expired.isEmpty()) {
            return 0;
        }

        for (StockReservation res : expired) {
            releaseReservationHold(res, ReservationStatus.EXPIRED, "Reservation TTL expired automatically");
        }

        log.info("Released {} expired stock reservations", expired.size());
        return expired.size();
    }

    private void releaseReservationHold(StockReservation res, ReservationStatus newStatus, String reason) {
        WarehouseStock stock = (res.getVariant() == null)
                ? warehouseStockRepository.findByWarehouseAndProductForUpdate(res.getWarehouse().getId(), res.getProduct().getId())
                        .orElse(null)
                : warehouseStockRepository.findByWarehouseAndProductAndVariantForUpdate(res.getWarehouse().getId(), res.getProduct().getId(), res.getVariant().getId())
                        .orElse(null);

        if (stock != null) {
            stock.setQuantityReserved(Math.max(0, stock.getQuantityReserved() - res.getReservedQuantity()));
            warehouseStockRepository.save(stock);

            InventoryTransaction tx = InventoryTransaction.builder()
                    .warehouse(res.getWarehouse())
                    .product(res.getProduct())
                    .variant(res.getVariant())
                    .transactionType(TransactionType.RESERVATION_RELEASE)
                    .quantityChange(-res.getReservedQuantity())
                    .quantityBefore(stock.getQuantityOnHand())
                    .quantityAfter(stock.getQuantityOnHand())
                    .referenceType("RESERVATION_EXPIRY")
                    .referenceId(res.getReservationToken())
                    .notes(reason)
                    .performedBy(res.getUser())
                    .build();
            inventoryTransactionRepository.save(tx);
        }

        res.setStatus(newStatus);
        stockReservationRepository.save(res);
    }

    private StockReservationResponse mapToDto(StockReservation sr) {
        return StockReservationResponse.builder()
                .id(sr.getId())
                .reservationToken(sr.getReservationToken())
                .warehouseId(sr.getWarehouse().getId())
                .warehouseName(sr.getWarehouse().getName())
                .productId(sr.getProduct().getId())
                .productTitle(sr.getProduct().getTitle())
                .variantId(sr.getVariant() != null ? sr.getVariant().getId() : null)
                .variantName(sr.getVariant() != null ? sr.getVariant().getVariantName() : null)
                .reservedQuantity(sr.getReservedQuantity())
                .status(sr.getStatus())
                .expiresAt(sr.getExpiresAt())
                .createdAt(sr.getCreatedAt())
                .build();
    }
}
