package com.alight.marketplace.config;

import com.alight.marketplace.modules.category.entity.Brand;
import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.category.repository.BrandRepository;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.inventory.entity.Warehouse;
import com.alight.marketplace.modules.inventory.entity.WarehouseStock;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository;
import com.alight.marketplace.modules.product.entity.*;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.user.entity.Permission;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.PermissionRepository;
import com.alight.marketplace.modules.user.repository.RoleRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.*;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import com.alight.marketplace.modules.currency.entity.Currency;
import com.alight.marketplace.modules.currency.repository.CurrencyRepository;
import com.alight.marketplace.modules.tax.entity.TaxCategory;
import com.alight.marketplace.modules.tax.repository.TaxCategoryRepository;
import com.alight.marketplace.modules.tax.repository.TaxRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final TaxCategoryRepository taxCategoryRepository;
    private final TaxRuleRepository taxRuleRepository;
    private final CurrencyRepository currencyRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting DataInitializer check and seed...");

        // 1. Seed Permissions Catalog (40+ items)
        seedPermissionsCatalog();

        // 2. Seed Roles and Bind Domain Permissions
        Role customerRole = seedRoleWithPermissions("ROLE_CUSTOMER", "Standard customer account", Set.of(
                "user:profile_manage", "user:address_manage", "catalog:read", "order:read_own",
                "order:cancel", "support:ticket_create", "support:ticket_reply", "review:create",
                "review:vote", "qa:ask", "returns:request_create"
        ));

        Role vendorRole = seedRoleWithPermissions("ROLE_VENDOR", "Registered vendor account", Set.of(
                "user:profile_manage", "user:address_manage", "catalog:read", "catalog:create",
                "catalog:update", "catalog:delete", "inventory:read", "inventory:update",
                "inventory:adjust", "order:read_vendor", "order:update_status", "vendor:profile_read",
                "vendor:profile_update", "vendor:kyc_submit", "settlement:wallet_read", "settlement:payout_request",
                "support:ticket_create", "support:ticket_reply", "qa:answer", "coupon:create_vendor",
                "logistics:manifest_create", "logistics:label_generate", "returns:vendor_action", "analytics:vendor_dashboard"
        ));

        Role adminRole = seedRoleWithAllPermissions("ROLE_ADMIN", "Platform administrator");
        Role superAdminRole = seedRoleWithAllPermissions("ROLE_SUPER_ADMIN", "Super administrator");

        // Seed granular operational admin roles
        seedRoleWithPermissions("ROLE_MARKETPLACE_ADMIN", "Marketplace Operations Admin", Set.of(
                "catalog:read", "catalog:approve", "catalog:publish", "vendor:profile_read", "vendor:verify_approve", "order:read_all"
        ));
        seedRoleWithPermissions("ROLE_FINANCE_ADMIN", "Finance & Settlement Admin", Set.of(
                "settlement:wallet_read", "settlement:payout_approve", "settlement:payout_process", "order:read_all", "analytics:platform_executive"
        ));
        seedRoleWithPermissions("ROLE_COMPLIANCE_ADMIN", "Compliance & Risk Admin", Set.of(
                "compliance:read", "compliance:verify", "risk:read", "risk:manage", "vendor:profile_read"
        ));

        // 3. Seed Users
        String encodedPassword = passwordEncoder.encode("password123");

        seedUser("superadmin@alight.com", encodedPassword, "Alight", "SuperAdmin", "+919876543209", Set.of(superAdminRole, adminRole, customerRole));
        User adminUser = seedUser("admin@alight.com", encodedPassword, "Alight", "Admin", "+919876543210", Set.of(adminRole, customerRole));
        User sellerUser = seedUser("seller@alight.com", encodedPassword, "Vikram", "Sharma", "+919876543211", Set.of(vendorRole, customerRole));
        User luxeUser = seedUser("luxe.seller@alight.com", encodedPassword, "Priya", "Mehta", "+919876543212", Set.of(customerRole));
        seedUser("customer@alight.com", encodedPassword, "Rahul", "Verma", "+919876543213", Set.of(customerRole));

        // 3. Seed Vendors
        Vendor approvedVendor = seedVendor(
                sellerUser,
                "Alight Hardware Atelier",
                "alight-hardware-atelier",
                "Direct manufacturer of precision German-engineered architectural hardware, modular kitchen pull-outs, and luxury solid brass bath accessories.",
                "atelier@alight.com",
                "+919876543211",
                new BigDecimal("8.50"),
                VendorStatus.APPROVED
        );

        seedVendor(
                luxeUser,
                "Luxe Fittings Studio",
                "luxe-fittings-studio",
                "Bespoke European imported wardrobe organizers and acoustic sliding partitions.",
                "support@luxefittings.com",
                "+919876543212",
                new BigDecimal("10.00"),
                VendorStatus.PENDING_VERIFICATION
        );

        // 4. Seed Category Hierarchy
        Category kitchen = seedCategory(null, "Kitchen Accessories", "kitchen-accessories", "Premium modular kitchen wire baskets, carousel units, and pantry organizers.", 1);
        Category kitchenBaskets = seedCategory(kitchen, "Modular Baskets & Pull-Outs", "modular-baskets-pull-outs", "Stainless steel SS304 soft-close pull-out baskets and spice racks.", 1);
        Category cutleryTrays = seedCategory(kitchen, "Cutlery Trays & Organizers", "cutlery-trays", "Wooden and acrylic drawer divider inserts.", 2);
        Category magicCorners = seedCategory(kitchen, "Corner Units & Magic Corners", "magic-corners", "Blind corner pull-out mechanisms maximizing dead storage space.", 3);

        Category bathroom = seedCategory(null, "Bathroom Accessories", "bathroom-accessories", "Luxury brass towel bars, soap dispensers, shower drains, and vanity fittings.", 2);
        Category towelRails = seedCategory(bathroom, "Towel Rails & Rings", "towel-rails-rings", "Solid forged brass wall-mounted towel holders.", 1);
        Category showerFixtures = seedCategory(bathroom, "Shower Fixtures & Drains", "shower-fixtures-drains", "Linear tile-insert concealed shower drains and thermostatic valves.", 2);

        Category wardrobe = seedCategory(null, "Wardrobe Accessories", "wardrobe-accessories", "Telescopic hangers, soft-close tie racks, jewelry trays, and pull-out mirrors.", 3);
        Category trouserRacks = seedCategory(wardrobe, "Pull-Out Trouser & Tie Racks", "pull-out-trouser-racks", "Damped slide organizers for closets and master wardrobes.", 1);
        Category jewelryTrays = seedCategory(wardrobe, "Velvet Jewelry Trays", "velvet-jewelry-trays", "Modular plush drawer organizers for watches, jewelry, and rings.", 2);

        Category hardware = seedCategory(null, "Architectural Hardware", "architectural-hardware", "Designer cabinet handles, mortise locks, soft-close hinges, and sliding door mechanisms.", 4);
        Category cabinetHandles = seedCategory(hardware, "Designer Cabinet Handles", "cabinet-handles", "Knurled solid brass T-bars, profile handles, and leather pulls.", 1);
        Category concealedHinges = seedCategory(hardware, "Concealed Soft-Close Hinges", "concealed-hinges", "Clip-top 110-degree 3D adjustable concealed hinges.", 2);

        // 5. Seed Brands
        Brand hafele = seedBrand("Hafele", "hafele", "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=200&q=80", "https://www.hafele.com", "World leader in architectural hardware and electronic access systems.");
        Brand blum = seedBrand("Blum", "blum", "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=200&q=80", "https://www.blum.com", "Austrian precision lift systems, hinge systems, and drawer runner mechanisms.");
        Brand hettich = seedBrand("Hettich", "hettich", "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=200&q=80", "https://www.hettich.com", "German intelligent technology for furniture and sliding fittings.");
        Brand kohler = seedBrand("Kohler", "kohler", "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80", "https://www.kohler.com", "Global benchmark in luxury kitchen and bath plumbing craftsmanship.");
        Brand alightAtelier = seedBrand("Alight Atelier", "alight-atelier", "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=200&q=80", "https://alight.com", "Handcrafted signature line of solid brass architectural fixtures and bespoke organizers.");

        // 6. Seed Products
        if (!productRepository.findBySlug("modular-ss304-soft-close-kitchen-pull-out-basket").isPresent()) {
            // Product 1
            seedProduct(
                    approvedVendor,
                    kitchenBaskets,
                    hafele,
                    "Modular SS304 Soft-Close Kitchen Pull-Out Basket",
                    "modular-ss304-soft-close-kitchen-pull-out-basket",
                    "Heavy-duty 2-tier stainless steel spice and bottle pull-out rack with synchronized soft-closing concealed runners.",
                    "Crafted from food-grade AISI-304 stainless steel with electro-polished chrome finish. Features 45kg load-rated synchronized soft-close bottom runners ensuring vibration-free movement even under full load. Tool-free clip-on basket assembly with adjustable dividers.",
                    new BigDecimal("4899.00"),
                    new BigDecimal("3999.00"),
                    "ALT-KTC-001",
                    85,
                    ProductStatus.ACTIVE,
                    true,
                    List.of(
                            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80",
                            "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1000&q=80"
                    ),
                    Map.of(
                            "Material", "Food Grade SS304 Stainless Steel",
                            "Load Capacity", "45 kg Synchronized Bottom Slides",
                            "Warranty", "10 Years Manufacturer Warranty"
                    ),
                    List.of(
                            Map.entry("200mm Width Carcass", new BigDecimal("3999.00")),
                            Map.entry("300mm Width Carcass", new BigDecimal("4499.00"))
                    )
            );

            // Product 2
            seedProduct(
                    approvedVendor,
                    cabinetHandles,
                    alightAtelier,
                    "Artisan Knurled Solid Brass Cabinet Pull Handle",
                    "artisan-knurled-solid-brass-cabinet-pull-handle",
                    "Diamond knurled precision-machined solid brass T-bar handle for luxury kitchen cabinetry and wardrobes.",
                    "Individually lathe-machined from single-billet C36000 solid architectural brass. Finished with baked clear nano-lacquer to prevent tarnishing while maintaining the tactile brilliance of the diamond cut knurling. Includes M4 breakaway mounting screws.",
                    new BigDecimal("1250.00"),
                    new BigDecimal("999.00"),
                    "ALT-HND-002",
                    250,
                    ProductStatus.ACTIVE,
                    true,
                    List.of(
                            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
                            "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80"
                    ),
                    Map.of(
                            "Material", "Solid Forged C36000 Architectural Brass",
                            "Center-to-Center", "160 mm / 6.3 inches",
                            "Finish Coating", "Electrostatically Baked Anti-Tarnish Clear Lacquer"
                    ),
                    List.of(
                            Map.entry("128mm Hole Center - Satin Brass", new BigDecimal("899.00")),
                            Map.entry("160mm Hole Center - Satin Brass", new BigDecimal("999.00")),
                            Map.entry("224mm Hole Center - Antique Bronze", new BigDecimal("1199.00"))
                    )
            );

            // Product 3
            seedProduct(
                    approvedVendor,
                    towelRails,
                    kohler,
                    "Kohler Architectural Matte Black Double Towel Bar 24\"",
                    "kohler-architectural-matte-black-double-towel-bar-24",
                    "Architectural grade matte black 24-inch double towel bar with concealed dual-anchor mounting.",
                    "Designed with clean geometric lines and premium corrosion-resistant PVD finish. Tested against 480-hour salt spray benchmarks to ensure lifetime endurance in high-humidity luxury bathrooms. Concealed hardware prevents visible screws.",
                    new BigDecimal("3450.00"),
                    new BigDecimal("2890.00"),
                    "ALT-BTH-003",
                    40,
                    ProductStatus.ACTIVE,
                    false,
                    List.of("https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80"),
                    Map.of(
                            "Material", "Solid Brass Core with PVD Coating",
                            "Length", "24 Inches (610 mm)",
                            "Finish", "Matte Black PVD"
                    ),
                    List.of(
                            Map.entry("24 Inch - Matte Black", new BigDecimal("2890.00")),
                            Map.entry("24 Inch - Brushed Gold", new BigDecimal("3290.00"))
                    )
            );

            // Product 4
            seedProduct(
                    approvedVendor,
                    jewelryTrays,
                    hafele,
                    "Modular Suede Velvet Watch & Jewelry Insert",
                    "modular-suede-velvet-watch-jewelry-insert",
                    "Custom-fit wardrobe drawer organizer wrapped in anti-tarnish micro-suede with dedicated watch pillows.",
                    "Transform standard wardrobe drawers into a bespoke luxury boutique display. Includes 6 cushioned watch slots, 12 ring rolls, and 8 versatile accessory compartments lined with soft-touch champagne velvet.",
                    new BigDecimal("2750.00"),
                    new BigDecimal("2200.00"),
                    "ALT-WRD-004",
                    60,
                    ProductStatus.ACTIVE,
                    true,
                    List.of("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80"),
                    Map.of(
                            "Material", "Engineered MDF wrapped in Anti-Tarnish Suede",
                            "Dimensions", "450 mm (W) x 480 mm (D) x 60 mm (H)"
                    ),
                    List.of(
                            Map.entry("Standard 6-Slot Grid", new BigDecimal("2200.00"))
                    )
            );

            // Product 5
            seedProduct(
                    approvedVendor,
                    magicCorners,
                    hettich,
                    "Hettich LeMans II Soft-Close Corner Carousel",
                    "hettich-lemans-ii-soft-close-corner-carousel",
                    "Ergonomic 2-shelf blind corner swinging carousel unit with non-slip arena anthracite trays.",
                    "Swings all shelf contents smoothly out of the blind kitchen corner cabinet with 25kg load capacity per tray. Soft-closing damping integrated in the pivot arm ensures silent operation.",
                    new BigDecimal("18500.00"),
                    new BigDecimal("15990.00"),
                    "ALT-KTC-005",
                    15,
                    ProductStatus.ACTIVE,
                    true,
                    List.of("https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80"),
                    Map.of(
                            "Opening Angle", "85-degree Door Clearance",
                            "Cabinet Width", "900 mm - 1000 mm Blind Corner",
                            "Tray Capacity", "25 kg per tray (50 kg total)"
                    ),
                    List.of(
                            Map.entry("Left Swivel Orientation", new BigDecimal("15990.00")),
                            Map.entry("Right Swivel Orientation", new BigDecimal("15990.00"))
                    )
            );

            // Product 6: Pending Approval item for testing Admin Moderation Queue
            seedProduct(
                    approvedVendor,
                    concealedHinges,
                    blum,
                    "Blum CLIP top BLUMOTION 110 Soft-Close Hinge (Pack of 10)",
                    "blum-clip-top-blumotion-110-hinge-pack-of-10",
                    "All-metal nickel-plated 110-degree concealed hinge with integrated BLUMOTION soft-close in hinge boss.",
                    "Provides seamless door motion with integrated deactivation switch for lighter doors. Features 3-dimensional adjustment (+/-2mm side, depth, height) and tool-free CLIP assembly.",
                    new BigDecimal("3800.00"),
                    new BigDecimal("3200.00"),
                    "ALT-BLM-006",
                    100,
                    ProductStatus.PENDING_APPROVAL,
                    false,
                    List.of("https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80"),
                    Map.of(
                            "Material", "Nickel-Plated Cold-Rolled Steel",
                            "Opening Angle", "110 Degrees",
                            "Mounting", "Tool-free CLIP mounting"
                    ),
                    List.of(
                            Map.entry("Pack of 10 Hinges", new BigDecimal("3200.00"))
                    )
            );
        }

        Warehouse delhiHub = seedWarehouse(
                approvedVendor,
                "Delhi NCR Primary Dispatch Hub",
                "WH-DEL-NCR-01",
                "Gopal Logistics Dispatcher",
                "+919876543211",
                "dispatch.delhi@alight.com",
                "Plot 42, Alight Industrial Park, Sector 58",
                "Gurugram",
                "Haryana",
                "122001",
                "IN",
                new BigDecimal("28.4595000"),
                new BigDecimal("77.0266000"),
                true
        );

        Warehouse mumbaiHub = seedWarehouse(
                approvedVendor,
                "Mumbai West Coast Logistics Center",
                "WH-MUM-WST-02",
                "Mahesh Patil",
                "+919876543214",
                "dispatch.mumbai@alight.com",
                "Unit 12, Kalher Logistics Park, Bhiwandi",
                "Mumbai",
                "Maharashtra",
                "421302",
                "IN",
                new BigDecimal("19.2813000"),
                new BigDecimal("73.0483000"),
                false
        );

        Warehouse centralHub = seedWarehouse(
                null, // Platform fulfillment center
                "Alight Central Platform Fulfillment Center",
                "WH-BLR-CTRL-01",
                "Platform Operations Lead",
                "+919876543210",
                "ops.bangalore@alight.com",
                "Hosur Road Industrial Area, Electronic City Phase 2",
                "Bengaluru",
                "Karnataka",
                "560100",
                "IN",
                new BigDecimal("12.8399000"),
                new BigDecimal("77.6770000"),
                true
        );

        // Distribute stock across warehouses for active products if missing
        List<Product> products = productRepository.findAll();
        for (Product p : products) {
            if (warehouseStockRepository.findFirstByWarehouseIdAndProductIdAndVariantIsNull(delhiHub.getId(), p.getId()).isEmpty()) {
                int onHand = Math.max(20, p.getStockQuantity());
                int delhiQty = (int) Math.round(onHand * 0.6);
                int mumbaiQty = onHand - delhiQty;

                seedStock(delhiHub, p, delhiQty, 10, 5);
                seedStock(mumbaiHub, p, mumbaiQty, 8, 3);
            }
        }

        // 8. Seed Tax Categories
        if (taxCategoryRepository.count() == 0) {
            taxCategoryRepository.save(TaxCategory.builder()
                    .code("GST_18_HW")
                    .name("Architectural Hardware & Fittings GST 18%")
                    .hsnSacCode("8302")
                    .description("Standard 18% GST for metal architectural hardware, handles, and modular kitchen fittings")
                    .isActive(true)
                    .build());

            taxCategoryRepository.save(TaxCategory.builder()
                    .code("GST_18_DEFAULT")
                    .name("Standard GST 18%")
                    .hsnSacCode("8517")
                    .description("Standard 18% GST rate")
                    .isActive(true)
                    .build());
        }

        // 9. Seed Standard Currencies
        if (currencyRepository.count() == 0) {
            currencyRepository.save(Currency.builder()
                    .code("INR")
                    .name("Indian Rupee")
                    .symbol("₹")
                    .decimalPlaces(2)
                    .isBase(true)
                    .isActive(true)
                    .exchangeRateToBase(BigDecimal.ONE)
                    .build());

            currencyRepository.save(Currency.builder()
                    .code("USD")
                    .name("US Dollar")
                    .symbol("$")
                    .decimalPlaces(2)
                    .isBase(false)
                    .isActive(true)
                    .exchangeRateToBase(new BigDecimal("0.01200000"))
                    .build());

            currencyRepository.save(Currency.builder()
                    .code("EUR")
                    .name("Euro")
                    .symbol("€")
                    .decimalPlaces(2)
                    .isBase(false)
                    .isActive(true)
                    .exchangeRateToBase(new BigDecimal("0.01100000"))
                    .build());

            currencyRepository.save(Currency.builder()
                    .code("GBP")
                    .name("British Pound")
                    .symbol("£")
                    .decimalPlaces(2)
                    .isBase(false)
                    .isActive(true)
                    .exchangeRateToBase(new BigDecimal("0.00950000"))
                    .build());
        }

        log.info("DataInitializer completed successfully! All demo records are seeded and ready.");
    }

    private Warehouse seedWarehouse(
            Vendor vendor,
            String name,
            String code,
            String contactName,
            String contactPhone,
            String contactEmail,
            String addr1,
            String city,
            String state,
            String postal,
            String country,
            BigDecimal lat,
            BigDecimal lon,
            boolean isPrimary
    ) {
        return warehouseRepository.findByCode(code).orElseGet(() -> {
            Warehouse w = Warehouse.builder()
                    .vendor(vendor)
                    .name(name)
                    .code(code)
                    .contactName(contactName)
                    .contactPhone(contactPhone)
                    .contactEmail(contactEmail)
                    .addressLine1(addr1)
                    .city(city)
                    .state(state)
                    .postalCode(postal)
                    .countryCode(country)
                    .latitude(lat)
                    .longitude(lon)
                    .active(true)
                    .primary(isPrimary)
                    .build();
            return warehouseRepository.save(w);
        });
    }

    private void seedStock(Warehouse warehouse, Product product, int qty, int reorder, int safety) {
        WarehouseStock ws = WarehouseStock.builder()
                .warehouse(warehouse)
                .product(product)
                .variant(null)
                .quantityOnHand(qty)
                .quantityReserved(0)
                .reorderThreshold(reorder)
                .safetyStock(safety)
                .build();
        warehouseStockRepository.save(ws);

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            int perVariant = Math.max(1, qty / product.getVariants().size());
            for (ProductVariant v : product.getVariants()) {
                WarehouseStock vws = WarehouseStock.builder()
                        .warehouse(warehouse)
                        .product(product)
                        .variant(v)
                        .quantityOnHand(perVariant)
                        .quantityReserved(0)
                        .reorderThreshold(reorder)
                        .safetyStock(safety)
                        .build();
                warehouseStockRepository.save(vws);
            }
        }
    }

    private void seedPermissionsCatalog() {
        String[][] perms = {
                {"catalog:read", "Browse public and active catalog products and categories"},
                {"catalog:create", "Create new draft products and variants under vendor account"},
                {"catalog:update", "Update owned vendor product specifications, prices, and media"},
                {"catalog:delete", "Delete or archive owned vendor products"},
                {"catalog:approve", "Approve or reject vendor submitted products for marketplace listing"},
                {"catalog:publish", "Publish or unpublish categories, brands, and featured collections"},
                {"inventory:read", "View warehouse stock levels and stock reservation status"},
                {"inventory:update", "Update owned product stock quantities on hand"},
                {"inventory:adjust", "Perform physical stock reconciliation and safety threshold adjustments"},
                {"inventory:reserve", "Hold stock reservations during customer checkout flow"},
                {"order:read_own", "View customer personal placed orders and tracking history"},
                {"order:read_vendor", "View assigned vendor fulfillment sub-orders and customer shipping details"},
                {"order:read_all", "View all marketplace master orders, sub-orders, and payments across vendors"},
                {"order:update_status", "Update vendor order fulfillment status (PROCESSING, SHIPPED, DELIVERED)"},
                {"order:cancel", "Cancel unfulfilled customer orders or cancel out-of-stock items"},
                {"vendor:profile_read", "View vendor business profile, store settings, and badges"},
                {"vendor:profile_update", "Update vendor store description, logo, and pickup warehouse addresses"},
                {"vendor:kyc_submit", "Submit vendor GSTIN, PAN, and bank account details for verification"},
                {"vendor:verify_approve", "Review, approve, or reject vendor onboarding applications"},
                {"vendor:commission_update", "Configure custom commission rates and payout hold windows per vendor"},
                {"settlement:wallet_read", "View vendor wallet balance, escrow holds, and transaction history"},
                {"settlement:payout_request", "Initiate vendor withdrawal / payout request from available balance"},
                {"settlement:payout_approve", "Approve vendor payout requests for disbursement"},
                {"settlement:payout_process", "Execute bank transfer disbursements and generate monthly GST commission invoices"},
                {"support:ticket_create", "Open customer or vendor support dispute ticket"},
                {"support:ticket_reply", "Reply to discussion messages in assigned support tickets"},
                {"support:ticket_assign", "Assign support tickets to specific support agents or admin teams"},
                {"support:ticket_resolve", "Close, escalate, or resolve support dispute tickets"},
                {"review:create", "Post customer product reviews and upload verified purchase photos"},
                {"review:vote", "Vote helpful or unhelpful on product reviews"},
                {"review:moderate", "Moderate, approve, or hide customer product reviews"},
                {"qa:ask", "Submit pre-purchase product questions"},
                {"qa:answer", "Answer customer questions for owned vendor products"},
                {"qa:moderate", "Moderate, edit, or delete inappropriate questions and answers"},
                {"coupon:create_vendor", "Create vendor-specific discount coupon codes"},
                {"coupon:create_global", "Create marketplace-wide global discount coupons and promotion rules"},
                {"coupon:manage_all", "Manage, activate, or deactivate any marketplace coupon or flash sale"},
                {"logistics:manifest_create", "Generate carrier pickup manifests and packing slips"},
                {"logistics:label_generate", "Generate shipping AWB labels and courier tracking numbers"},
                {"logistics:carrier_manage", "Configure shipping carriers, pincode zones, and weight slab rates"},
                {"returns:request_create", "Initiate 7-day customer return or exchange request with photo proof"},
                {"returns:vendor_action", "Accept, reject, or request replacement for vendor return items"},
                {"returns:admin_override", "Override return decisions and authorize immediate customer refund"},
                {"returns:inspect", "Perform physical warehouse return quality inspection and grading"},
                {"analytics:vendor_dashboard", "View vendor sales volume, top products, ratings, and return rates"},
                {"analytics:platform_executive", "View platform-wide GMV, vendor settlement ledger, and profit metrics"},
                {"system:user_role_manage", "Assign, modify, and revoke user roles and fine-grained permissions"},
                {"system:audit_read", "Inspect immutable system audit logs, actor trails, and security events"},
                {"system:config_manage", "Configure marketplace currencies, tax jurisdictions, and payment gateways"},
                {"user:profile_manage", "Read and update own user profile details"},
                {"user:address_manage", "Manage saved shipping and billing addresses"},
                {"cms:read", "View storefront layouts, hero slides, and promotional banners"},
                {"cms:manage", "Create, update, schedule, and publish storefront CMS content and banners"},
                {"risk:read", "View marketplace risk scores, fraud alerts, and suspicious patterns"},
                {"risk:manage", "Manage blacklists, whitelists, account restrictions, and fraud mitigation rules"},
                {"compliance:read", "Inspect vendor KYC documents, GSTIN filings, and regulatory certifications"},
                {"compliance:verify", "Approve, reject, or request re-submission for legal and tax compliance documents"},
                {"dispute:read", "View customer-vendor transaction disputes, evidence, and escalations"},
                {"dispute:mediate", "Mediate disputes, issue refund decisions, and apply ledger adjustments"}
        };

        for (String[] p : perms) {
            if (!permissionRepository.existsByName(p[0])) {
                Permission perm = Permission.builder().name(p[0]).description(p[1]).build();
                permissionRepository.save(perm);
            }
        }
    }

    private Role seedRoleWithPermissions(String name, String description, Set<String> permNames) {
        Role role = roleRepository.findByName(name).orElseGet(() -> {
            Role r = Role.builder().name(name).description(description).build();
            return roleRepository.save(r);
        });

        Set<Permission> targetPerms = new HashSet<>();
        for (String pName : permNames) {
            permissionRepository.findByName(pName).ifPresent(targetPerms::add);
        }
        if (role.getPermissions() == null || role.getPermissions().isEmpty()) {
            role.setPermissions(targetPerms);
            role = roleRepository.save(role);
        }
        return role;
    }

    private Role seedRoleWithAllPermissions(String name, String description) {
        Role role = roleRepository.findByName(name).orElseGet(() -> {
            Role r = Role.builder().name(name).description(description).build();
            return roleRepository.save(r);
        });

        if (role.getPermissions() == null || role.getPermissions().isEmpty()) {
            role.setPermissions(new HashSet<>(permissionRepository.findAll()));
            role = roleRepository.save(role);
        }
        return role;
    }

    private User seedUser(String email, String passwordHash, String firstName, String lastName, String phone, Set<Role> roles) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.builder()
                    .email(email)
                    .passwordHash(passwordHash)
                    .firstName(firstName)
                    .lastName(lastName)
                    .phone(phone)
                    .active(true)
                    .emailVerified(true)
                    .phoneVerified(true)
                    .roles(roles)
                    .build();
            return userRepository.save(user);
        });
    }

    private Vendor seedVendor(User user, String storeName, String slug, String description, String supportEmail, String supportPhone, BigDecimal commission, VendorStatus status) {
        return vendorRepository.findBySlug(slug).orElseGet(() -> {
            Vendor vendor = Vendor.builder()
                    .user(user)
                    .storeName(storeName)
                    .slug(slug)
                    .description(description)
                    .supportEmail(supportEmail)
                    .supportPhone(supportPhone)
                    .commissionPercentage(commission)
                    .status(status)
                    .build();

            VendorBusinessDetails details = VendorBusinessDetails.builder()
                    .vendor(vendor)
                    .legalBusinessName(storeName + " Pvt Ltd")
                    .businessType(BusinessType.PRIVATE_LIMITED)
                    .taxIdGstin("27AABCA1234F1Z5")
                    .panNumber("AABCA1234F")
                    .bankAccountNumber("918273645019")
                    .bankIfscCode("HDFC0001234")
                    .bankName("HDFC Bank")
                    .bankAccountHolderName(storeName + " Pvt Ltd")
                    .verified(status == VendorStatus.APPROVED)
                    .build();
            vendor.setBusinessDetails(details);

            if (status == VendorStatus.APPROVED) {
                VendorPickupAddress addr = VendorPickupAddress.builder()
                        .vendor(vendor)
                        .contactPerson("Gopal Logistics")
                        .contactPhone(supportPhone)
                        .addressLine1("Plot 42, Alight Industrial Park")
                        .city("Gurugram")
                        .state("Haryana")
                        .postalCode("122001")
                        .primary(true)
                        .build();
                vendor.getPickupAddresses().add(addr);
            }

            return vendorRepository.save(vendor);
        });
    }

    private Category seedCategory(Category parent, String name, String slug, String description, int order) {
        return categoryRepository.findBySlug(slug).orElseGet(() -> {
            Category category = Category.builder()
                    .parent(parent)
                    .name(name)
                    .slug(slug)
                    .description(description)
                    .displayOrder(order)
                    .active(true)
                    .build();
            return categoryRepository.save(category);
        });
    }

    private Brand seedBrand(String name, String slug, String logoUrl, String websiteUrl, String description) {
        return brandRepository.findBySlug(slug).orElseGet(() -> {
            Brand brand = Brand.builder()
                    .name(name)
                    .slug(slug)
                    .logoUrl(logoUrl)
                    .websiteUrl(websiteUrl)
                    .description(description)
                    .active(true)
                    .build();
            return brandRepository.save(brand);
        });
    }

    private void seedProduct(
            Vendor vendor,
            Category category,
            Brand brand,
            String title,
            String slug,
            String shortDesc,
            String desc,
            BigDecimal basePrice,
            BigDecimal discountPrice,
            String sku,
            int stockQty,
            ProductStatus status,
            boolean featured,
            List<String> images,
            Map<String, String> attributes,
            List<Map.Entry<String, BigDecimal>> variants
    ) {
        Product product = Product.builder()
                .vendor(vendor)
                .category(category)
                .brand(brand)
                .title(title)
                .slug(slug)
                .shortDescription(shortDesc)
                .description(desc)
                .basePrice(basePrice)
                .discountPrice(discountPrice)
                .sku(sku)
                .stockQuantity(stockQty)
                .status(status)
                .featured(featured)
                .build();

        int imgOrder = 0;
        for (String url : images) {
            ProductImage img = ProductImage.builder()
                    .imageUrl(url)
                    .altText(title)
                    .displayOrder(imgOrder)
                    .primary(imgOrder == 0)
                    .build();
            product.getImages().add(img);
            img.setProduct(product);
            imgOrder++;
        }

        int attrOrder = 0;
        for (Map.Entry<String, String> entry : attributes.entrySet()) {
            ProductAttribute attr = ProductAttribute.builder()
                    .attributeName(entry.getKey())
                    .attributeValue(entry.getValue())
                    .displayOrder(attrOrder++)
                    .build();
            product.getAttributes().add(attr);
            attr.setProduct(product);
        }

        int vCount = 1;
        for (Map.Entry<String, BigDecimal> v : variants) {
            ProductVariant variant = ProductVariant.builder()
                    .variantName(v.getKey())
                    .variantSku(sku + "-V" + vCount++)
                    .price(v.getValue())
                    .stockQuantity(stockQty / variants.size())
                    .active(true)
                    .build();
            product.getVariants().add(variant);
            variant.setProduct(product);
        }

        productRepository.save(product);
    }
}
