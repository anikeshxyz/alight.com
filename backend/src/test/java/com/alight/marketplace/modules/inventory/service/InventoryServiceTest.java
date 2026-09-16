package com.alight.marketplace.modules.inventory.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.modules.inventory.dto.StockAdjustmentRequest;
import com.alight.marketplace.modules.inventory.dto.WarehouseStockDto;
import com.alight.marketplace.modules.inventory.entity.InventoryTransaction;
import com.alight.marketplace.modules.inventory.entity.TransactionType;
import com.alight.marketplace.modules.inventory.entity.Warehouse;
import com.alight.marketplace.modules.inventory.entity.WarehouseStock;
import com.alight.marketplace.modules.inventory.repository.InventoryTransactionRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository;
import com.alight.marketplace.modules.inventory.service.impl.InventoryServiceImpl;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

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
    private VendorRepository vendorRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private User testUser;
    private Vendor testVendor;
    private Warehouse testWarehouse;
    private Product testProduct;
    private WarehouseStock testStock;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("seller@alight.com")
                .firstName("Vikram")
                .lastName("Sharma")
                .build();

        testVendor = Vendor.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .storeName("Alight Hardware")
                .slug("alight-hardware")
                .build();

        testWarehouse = Warehouse.builder()
                .id(UUID.randomUUID())
                .vendor(testVendor)
                .name("Delhi Hub")
                .code("WH-DEL-01")
                .active(true)
                .build();

        testProduct = Product.builder()
                .id(UUID.randomUUID())
                .vendor(testVendor)
                .title("Knurled Brass Handle")
                .sku("ALT-HND-001")
                .stockQuantity(100)
                .build();

        testStock = WarehouseStock.builder()
                .id(UUID.randomUUID())
                .warehouse(testWarehouse)
                .product(testProduct)
                .quantityOnHand(100)
                .quantityReserved(10)
                .reorderThreshold(20)
                .safetyStock(5)
                .build();
    }

    @Test
    @DisplayName("adjustStock increments on-hand quantity for INBOUND_RECEIPT")
    void testInboundAdjustment() {
        StockAdjustmentRequest req = StockAdjustmentRequest.builder()
                .warehouseId(testWarehouse.getId())
                .productId(testProduct.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(50)
                .notes("Restock lot #441")
                .build();

        when(vendorRepository.findByUserEmail("seller@alight.com")).thenReturn(Optional.of(testVendor));
        when(userRepository.findByEmail("seller@alight.com")).thenReturn(Optional.of(testUser));
        when(warehouseRepository.findById(testWarehouse.getId())).thenReturn(Optional.of(testWarehouse));
        when(productRepository.findById(testProduct.getId())).thenReturn(Optional.of(testProduct));
        when(warehouseStockRepository.findByWarehouseAndProductForUpdate(testWarehouse.getId(), testProduct.getId()))
                .thenReturn(Optional.of(testStock));
        when(warehouseStockRepository.save(any(WarehouseStock.class))).thenAnswer(inv -> inv.getArgument(0));
        when(warehouseStockRepository.sumAvailableStockByProduct(testProduct.getId())).thenReturn(140);

        WarehouseStockDto result = inventoryService.adjustStock(req, "seller@alight.com");

        assertThat(result.getQuantityOnHand()).isEqualTo(150);
        assertThat(result.getQuantityAvailable()).isEqualTo(140); // 150 - 10
        verify(inventoryTransactionRepository, times(1)).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("adjustStock throws error when reducing stock below reserved quantity")
    void testCannotReduceBelowReserved() {
        StockAdjustmentRequest req = StockAdjustmentRequest.builder()
                .warehouseId(testWarehouse.getId())
                .productId(testProduct.getId())
                .transactionType(TransactionType.ADJUSTMENT_SUBTRACT)
                .quantity(95) // 100 - 95 = 5 < 10 reserved
                .build();

        when(vendorRepository.findByUserEmail("seller@alight.com")).thenReturn(Optional.of(testVendor));
        when(userRepository.findByEmail("seller@alight.com")).thenReturn(Optional.of(testUser));
        when(warehouseRepository.findById(testWarehouse.getId())).thenReturn(Optional.of(testWarehouse));
        when(productRepository.findById(testProduct.getId())).thenReturn(Optional.of(testProduct));
        when(warehouseStockRepository.findByWarehouseAndProductForUpdate(testWarehouse.getId(), testProduct.getId()))
                .thenReturn(Optional.of(testStock));

        assertThatThrownBy(() -> inventoryService.adjustStock(req, "seller@alight.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot reduce stock below currently reserved quantity");
    }
}
