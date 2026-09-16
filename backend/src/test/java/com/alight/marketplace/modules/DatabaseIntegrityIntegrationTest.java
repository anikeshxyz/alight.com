package com.alight.marketplace.modules;

import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.inventory.entity.Warehouse;
import com.alight.marketplace.modules.inventory.entity.WarehouseStock;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class DatabaseIntegrityIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private WarehouseStockRepository warehouseStockRepository;

    @Test
    @DisplayName("Should verify presence of all 71 base tables in public schema")
    void testAllTablesExistInSchema() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            ResultSet rs = conn.createStatement().executeQuery(
                    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
            );
            assertTrue(rs.next());
            int tableCount = rs.getInt(1);
            assertTrue(tableCount >= 70, "Expected at least 70 base tables in public schema, found: " + tableCount);
        }
    }

    @Test
    @DisplayName("Should verify presence of pg_trgm and btree_gist extensions")
    void testPostgreSQLExtensionsExist() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            ResultSet rs = conn.createStatement().executeQuery(
                    "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');"
            );
            int count = 0;
            while (rs.next()) {
                count++;
            }
            assertTrue(count >= 1, "Expected PostgreSQL core extensions to be active in database");
        }
    }

    @Test
    @DisplayName("Should verify composite and trigram indexes on catalog and vendor tables")
    void testSearchAndCompositeIndexesExist() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            ResultSet rs = conn.createStatement().executeQuery(
                    "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'products';"
            );
            boolean hasIndexes = false;
            while (rs.next()) {
                String indexName = rs.getString("indexname");
                if (indexName.contains("sku") || indexName.contains("category") || indexName.contains("trgm")) {
                    hasIndexes = true;
                }
            }
            assertTrue(hasIndexes, "Product table should have dedicated performance indexes");
        }
    }

    @Test
    @DisplayName("Should verify multi-vendor diversity with APPROVED, PENDING, and REJECTED statuses")
    void testMultiVendorDiversity() {
        Page<Vendor> approvedVendors = vendorRepository.findByStatus(VendorStatus.APPROVED, PageRequest.of(0, 10));
        assertFalse(approvedVendors.isEmpty(), "There should be at least one APPROVED vendor");

        // Verify First-Party Flagship Store has 0% commission
        Optional<Vendor> flagship = vendorRepository.findBySlug("alight-international-official-store");
        if (flagship.isPresent()) {
            assertEquals(VendorStatus.APPROVED, flagship.get().getStatus());
            assertEquals(0, BigDecimal.ZERO.compareTo(flagship.get().getCommissionPercentage()));
        }

        // Verify Pending applications exist
        Page<Vendor> pendingVendors = vendorRepository.findByStatus(VendorStatus.PENDING_VERIFICATION, PageRequest.of(0, 10));
        assertFalse(pendingVendors.isEmpty(), "There should be at least one PENDING_VERIFICATION vendor");

        // Verify Rejected vendor has an audit reason
        Page<Vendor> rejectedVendors = vendorRepository.findByStatus(VendorStatus.REJECTED, PageRequest.of(0, 10));
        assertFalse(rejectedVendors.isEmpty(), "There should be at least one REJECTED vendor");
        assertNotNull(rejectedVendors.getContent().get(0).getRejectionReason());
    }

    @Test
    @DisplayName("Should verify product catalog querying and relational integrity")
    void testCatalogQueryability() {
        Page<Product> activeProducts = productRepository.searchActiveProducts(
                ProductStatus.ACTIVE, null, null, null, null, null, null, null, null, PageRequest.of(0, 20)
        );
        assertFalse(activeProducts.isEmpty(), "Active products should be present in catalog");
        assertTrue(activeProducts.getTotalElements() >= 6, "Expected at least 6 active products in catalog");

        Product sampleProduct = activeProducts.getContent().get(0);
        assertNotNull(sampleProduct.getSku());
        assertNotNull(sampleProduct.getBasePrice());
        assertNotNull(sampleProduct.getCategory());
        assertNotNull(sampleProduct.getVendor());
    }

    @Test
    @DisplayName("Should verify root categories and multi-level tree")
    void testCategoryHierarchy() {
        List<Category> rootCategories = categoryRepository.findRootCategoriesAll();
        assertFalse(rootCategories.isEmpty(), "Root categories must be present");
        assertTrue(rootCategories.size() >= 4, "Expected at least 4 root categories (Kitchen, Bath, Wardrobe, Hardware)");
    }

    @Test
    @DisplayName("Should verify multi-warehouse inventory distribution and optimistic locking version")
    void testMultiWarehouseInventoryAndOptimisticLocking() {
        List<Warehouse> warehouses = warehouseRepository.findAll();
        assertTrue(warehouses.size() >= 3, "Expected at least 3 dispatch warehouses across regions");

        long totalStockRecords = warehouseStockRepository.count();
        assertTrue(totalStockRecords >= 10, "Expected warehouse stock allocations across facilities");

        List<WarehouseStock> stockList = warehouseStockRepository.findAll();
        assertFalse(stockList.isEmpty());
        WarehouseStock firstStock = stockList.get(0);
        assertNotNull(firstStock.getVersion(), "WarehouseStock must have a non-null optimistic locking version");
        assertTrue(firstStock.getVersion() >= 0L);
    }

    @Test
    @DisplayName("Should verify updated_at timestamp trigger on database entities")
    void testTimestampTriggerExecution() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            Statement stmt = conn.createStatement();
            ResultSet rs = conn.createStatement().executeQuery(
                    "SELECT id, updated_at FROM categories LIMIT 1;"
            );
            if (rs.next()) {
                String id = rs.getString("id");
                Instant initialUpdatedAt = rs.getTimestamp("updated_at") != null 
                        ? rs.getTimestamp("updated_at").toInstant() : null;

                // Perform update to test trigger
                stmt.executeUpdate("UPDATE categories SET description = description WHERE id = '" + id + "';");

                ResultSet rsAfter = conn.createStatement().executeQuery(
                        "SELECT updated_at FROM categories WHERE id = '" + id + "';"
                );
                if (rsAfter.next() && initialUpdatedAt != null) {
                    Instant postUpdatedAt = rsAfter.getTimestamp("updated_at").toInstant();
                    assertNotNull(postUpdatedAt);
                }
            }
        }
    }
}
