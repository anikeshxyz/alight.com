package com.alight.marketplace.modules.inventory;

import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CreateCategoryRequest;
import com.alight.marketplace.modules.category.service.CategoryService;
import com.alight.marketplace.modules.inventory.dto.*;
import com.alight.marketplace.modules.inventory.entity.ReservationStatus;
import com.alight.marketplace.modules.inventory.entity.TransactionType;
import com.alight.marketplace.modules.inventory.service.InventoryService;
import com.alight.marketplace.modules.inventory.service.StockReservationService;
import com.alight.marketplace.modules.inventory.service.WarehouseService;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.alight.marketplace.modules.vendor.dto.VendorApplicationRequest;
import com.alight.marketplace.modules.vendor.dto.VendorResponseDto;
import com.alight.marketplace.modules.vendor.entity.BusinessType;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.service.AdminVendorService;
import com.alight.marketplace.modules.vendor.service.VendorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class InventoryManagementIntegrationTest {

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private StockReservationService stockReservationService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private AdminVendorService adminVendorService;

    @Autowired
    private VendorProductService vendorProductService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuthService authService;

    private String vendorEmail;
    private WarehouseDto warehouseA;
    private WarehouseDto warehouseB;
    private ProductResponseDto testProduct;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        vendorEmail = "inventory_seller_" + suffix + "@alight.com";

        // Register and approve vendor
        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("Password123!")
                .firstName("Inventory")
                .lastName("Merchant")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());

        VendorResponseDto vendorApp = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Inventory Depot " + suffix)
                .description("Multi-warehouse distribution network")
                .supportEmail(vendorEmail)
                .supportPhone("+15551112233")
                .legalBusinessName("Inventory Depot LLC")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("556677889900")
                .bankIfscCode("HDFC0007788")
                .bankName("HDFC")
                .bankAccountHolderName("Inventory Depot LLC")
                .pickupContactPerson("Warehouse Lead")
                .pickupContactPhone("+15551112233")
                .pickupAddressLine1("Highway 10")
                .pickupCity("Pune")
                .pickupState("Maharashtra")
                .pickupPostalCode("411001")
                .pickupCountry("India")
                .build());

        adminVendorService.updateVendorStatus(vendorApp.getId(),
                com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest.builder()
                        .status(VendorStatus.APPROVED)
                        .build());

        // Create Warehouses
        warehouseA = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("West Hub Warehouse " + suffix)
                .code("WH-WEST-" + suffix.toUpperCase())
                .addressLine1("West Logistics Park")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vendorEmail);

        warehouseB = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("North Hub Warehouse " + suffix)
                .code("WH-NORTH-" + suffix.toUpperCase())
                .addressLine1("North Ring Road")
                .city("Delhi")
                .state("Delhi")
                .postalCode("110001")
                .countryCode("IN")
                .primary(false)
                .active(true)
                .build(), vendorEmail);

        // Create Category and Product
        CategoryDto category = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Industrial Tools " + suffix)
                .active(true)
                .build());

        testProduct = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(category.getId())
                .title("Heavy-Duty Precision Torque Wrench")
                .basePrice(new BigDecimal("89.99"))
                .sku("TW-" + suffix.toUpperCase())
                .stockQuantity(0)
                .build());

        productRepository.findById(testProduct.getId()).ifPresent(p -> {
            p.setStatus(ProductStatus.ACTIVE);
            productRepository.save(p);
        });
    }

    @Test
    @DisplayName("Should create warehouses and verify primary warehouse designation")
    void testWarehouseManagement() {
        assertNotNull(warehouseA);
        assertTrue(warehouseA.isPrimary());
        assertEquals("Mumbai", warehouseA.getCity());

        assertNotNull(warehouseB);
        assertFalse(warehouseB.isPrimary());

        List<WarehouseDto> list = warehouseService.getVendorWarehouses(vendorEmail);
        assertEquals(2, list.size());
    }

    @Test
    @DisplayName("Should receive inbound stock and verify available quantity")
    void testInboundStockAdjustment() {
        WarehouseStockDto stock = inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(warehouseA.getId())
                .productId(testProduct.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(100)
                .notes("Initial purchase order receipt")
                .build(), vendorEmail);

        assertNotNull(stock);
        assertEquals(100, stock.getQuantityOnHand());
        assertEquals(0, stock.getQuantityReserved());
        assertEquals(100, stock.getQuantityAvailable());
        assertFalse(stock.isLowStock());
    }

    @Test
    @DisplayName("Should transfer stock between warehouses and audit movements")
    void testStockTransfer() {
        // Initial inbound to warehouse A
        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(warehouseA.getId())
                .productId(testProduct.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(100)
                .build(), vendorEmail);

        // Transfer 30 units from Warehouse A to Warehouse B
        inventoryService.transferStock(StockTransferRequest.builder()
                .sourceWarehouseId(warehouseA.getId())
                .destinationWarehouseId(warehouseB.getId())
                .productId(testProduct.getId())
                .quantity(30)
                .notes("Inter-warehouse rebalancing")
                .build(), vendorEmail);

        List<WarehouseStockDto> stocksA = inventoryService.getInventoryByWarehouse(warehouseA.getId(), vendorEmail);
        assertEquals(70, stocksA.get(0).getQuantityOnHand());

        List<WarehouseStockDto> stocksB = inventoryService.getInventoryByWarehouse(warehouseB.getId(), vendorEmail);
        assertEquals(30, stocksB.get(0).getQuantityOnHand());
    }

    @Test
    @DisplayName("Should perform stock reservation hold and confirm upon order completion")
    void testStockReservationLifecycle() {
        // 1. Initial inbound stock
        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(warehouseA.getId())
                .productId(testProduct.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(50)
                .build(), vendorEmail);

        // 2. Reserve 5 units for customer checkout
        StockReservationResponse res = stockReservationService.createReservation(StockReservationRequest.builder()
                .productId(testProduct.getId())
                .warehouseId(warehouseA.getId())
                .quantity(5)
                .ttlMinutes(15)
                .build(), vendorEmail);

        assertNotNull(res);
        assertNotNull(res.getReservationToken());
        assertEquals(ReservationStatus.PENDING, res.getStatus());
        assertEquals(5, res.getReservedQuantity());

        // Check stock availability (on_hand=50, reserved=5, available=45)
        List<WarehouseStockDto> stocks = inventoryService.getInventoryByWarehouse(warehouseA.getId(), vendorEmail);
        assertEquals(50, stocks.get(0).getQuantityOnHand());
        assertEquals(5, stocks.get(0).getQuantityReserved());
        assertEquals(45, stocks.get(0).getQuantityAvailable());

        // 3. Confirm reservation upon payment
        stockReservationService.confirmReservation(res.getReservationToken());

        List<WarehouseStockDto> confirmedStocks = inventoryService.getInventoryByWarehouse(warehouseA.getId(), vendorEmail);
        assertEquals(45, confirmedStocks.get(0).getQuantityOnHand());
        assertEquals(0, confirmedStocks.get(0).getQuantityReserved());
        assertEquals(45, confirmedStocks.get(0).getQuantityAvailable());
    }

    @Test
    @DisplayName("Should cancel stock reservation and release hold")
    void testCancelReservation() {
        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(warehouseA.getId())
                .productId(testProduct.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(20)
                .build(), vendorEmail);

        StockReservationResponse res = stockReservationService.createReservation(StockReservationRequest.builder()
                .productId(testProduct.getId())
                .warehouseId(warehouseA.getId())
                .quantity(8)
                .ttlMinutes(15)
                .build(), vendorEmail);

        // Cancel checkout
        stockReservationService.cancelReservation(res.getReservationToken());

        List<WarehouseStockDto> stocks = inventoryService.getInventoryByWarehouse(warehouseA.getId(), vendorEmail);
        assertEquals(20, stocks.get(0).getQuantityOnHand());
        assertEquals(0, stocks.get(0).getQuantityReserved());
        assertEquals(20, stocks.get(0).getQuantityAvailable());
    }

    @Test
    @DisplayName("Should detect low stock alert when available quantity is below threshold")
    void testLowStockAlert() {
        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(warehouseA.getId())
                .productId(testProduct.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(3) // Threshold is default 5
                .build(), vendorEmail);

        List<WarehouseStockDto> lowStockList = inventoryService.getVendorLowStockAlerts(vendorEmail);
        assertNotNull(lowStockList);
        assertFalse(lowStockList.isEmpty());
        assertTrue(lowStockList.get(0).isLowStock());
        assertEquals(3, lowStockList.get(0).getQuantityAvailable());
    }
}
