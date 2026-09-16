package com.alight.marketplace.modules.inventory.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.modules.inventory.dto.StockReservationRequest;
import com.alight.marketplace.modules.inventory.dto.StockReservationResponse;
import com.alight.marketplace.modules.inventory.entity.*;
import com.alight.marketplace.modules.inventory.repository.InventoryTransactionRepository;
import com.alight.marketplace.modules.inventory.repository.StockReservationRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository;
import com.alight.marketplace.modules.inventory.service.impl.StockReservationServiceImpl;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockReservationServiceTest {

    @Mock
    private StockReservationRepository stockReservationRepository;
    @Mock
    private WarehouseStockRepository warehouseStockRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductVariantRepository productVariantRepository;
    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private StockReservationServiceImpl stockReservationService;

    private User testUser;
    private Warehouse testWarehouse;
    private Product testProduct;
    private WarehouseStock testStock;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("customer@alight.com")
                .firstName("Rahul")
                .lastName("Verma")
                .build();

        testWarehouse = Warehouse.builder()
                .id(UUID.randomUUID())
                .name("Delhi Hub")
                .code("WH-DEL-01")
                .active(true)
                .build();

        testProduct = Product.builder()
                .id(UUID.randomUUID())
                .title("Modular SS304 Basket")
                .sku("ALT-KTC-001")
                .build();

        testStock = WarehouseStock.builder()
                .id(UUID.randomUUID())
                .warehouse(testWarehouse)
                .product(testProduct)
                .quantityOnHand(50)
                .quantityReserved(5) // Available = 45
                .build();
    }

    @Test
    @DisplayName("createReservation reserves stock and increments reserved quantity")
    void testCreateReservation() {
        StockReservationRequest req = StockReservationRequest.builder()
                .productId(testProduct.getId())
                .warehouseId(testWarehouse.getId())
                .quantity(10)
                .ttlMinutes(15)
                .build();

        when(userRepository.findByEmail("customer@alight.com")).thenReturn(Optional.of(testUser));
        when(productRepository.findById(testProduct.getId())).thenReturn(Optional.of(testProduct));
        when(warehouseRepository.findById(testWarehouse.getId())).thenReturn(Optional.of(testWarehouse));
        when(warehouseStockRepository.findByWarehouseAndProductForUpdate(testWarehouse.getId(), testProduct.getId()))
                .thenReturn(Optional.of(testStock));
        when(stockReservationRepository.save(any(StockReservation.class))).thenAnswer(inv -> {
            StockReservation sr = inv.getArgument(0);
            sr.setId(UUID.randomUUID());
            return sr;
        });

        StockReservationResponse res = stockReservationService.createReservation(req, "customer@alight.com");

        assertThat(res.getReservedQuantity()).isEqualTo(10);
        assertThat(testStock.getQuantityReserved()).isEqualTo(15); // 5 + 10
        assertThat(res.getStatus()).isEqualTo(ReservationStatus.PENDING);
        verify(inventoryTransactionRepository, times(1)).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("createReservation fails if available stock is insufficient")
    void testInsufficientStockForReservation() {
        StockReservationRequest req = StockReservationRequest.builder()
                .productId(testProduct.getId())
                .warehouseId(testWarehouse.getId())
                .quantity(100) // Available is only 45
                .build();

        when(productRepository.findById(testProduct.getId())).thenReturn(Optional.of(testProduct));
        when(warehouseRepository.findById(testWarehouse.getId())).thenReturn(Optional.of(testWarehouse));
        when(warehouseStockRepository.findByWarehouseAndProductForUpdate(testWarehouse.getId(), testProduct.getId()))
                .thenReturn(Optional.of(testStock));

        assertThatThrownBy(() -> stockReservationService.createReservation(req, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock available");
    }

    @Test
    @DisplayName("releaseExpiredReservations releases expired holds back to available pool")
    void testReleaseExpiredReservations() {
        StockReservation expired = StockReservation.builder()
                .id(UUID.randomUUID())
                .reservationToken("RES-1234")
                .warehouse(testWarehouse)
                .product(testProduct)
                .reservedQuantity(8)
                .status(ReservationStatus.PENDING)
                .expiresAt(Instant.now().minusSeconds(600))
                .build();

        testStock.setQuantityReserved(8);

        when(stockReservationRepository.findExpiredPendingReservations(any(Instant.class))).thenReturn(List.of(expired));
        when(warehouseStockRepository.findByWarehouseAndProductForUpdate(testWarehouse.getId(), testProduct.getId()))
                .thenReturn(Optional.of(testStock));

        int releasedCount = stockReservationService.releaseExpiredReservations();

        assertThat(releasedCount).isEqualTo(1);
        assertThat(testStock.getQuantityReserved()).isEqualTo(0);
        assertThat(expired.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
    }
}
