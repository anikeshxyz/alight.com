package com.alight.marketplace.config;

import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
class OpenApiSpecificationIntegrationTest {

    @Autowired
    private OpenAPI openAPI;

    @Autowired
    private List<GroupedOpenApi> groupedOpenApis;

    @Test
    @DisplayName("Should verify OpenAPI metadata and title configuration")
    void testOpenApiMetadata() {
        assertNotNull(openAPI);
        assertNotNull(openAPI.getInfo());
        assertEquals("Alight International Multi-Vendor Marketplace API", openAPI.getInfo().getTitle());
        assertEquals("v1.0.0", openAPI.getInfo().getVersion());
        assertNotNull(openAPI.getInfo().getContact());
        assertEquals("dev@alight.com", openAPI.getInfo().getContact().getEmail());
    }

    @Test
    @DisplayName("Should verify BearerAuth JWT security scheme is registered")
    void testSecuritySchemeConfigured() {
        assertNotNull(openAPI.getComponents());
        assertNotNull(openAPI.getComponents().getSecuritySchemes());
        assertTrue(openAPI.getComponents().getSecuritySchemes().containsKey("BearerAuth"));

        var securityScheme = openAPI.getComponents().getSecuritySchemes().get("BearerAuth");
        assertEquals("bearer", securityScheme.getScheme());
        assertEquals("JWT", securityScheme.getBearerFormat());
    }

    @Test
    @DisplayName("Should verify Multi-Environment Server configurations")
    void testMultiEnvironmentServers() {
        assertNotNull(openAPI.getServers());
        assertFalse(openAPI.getServers().isEmpty());
        assertTrue(openAPI.getServers().size() >= 3, "Expected Local, Staging, and Production servers");

        boolean hasStaging = openAPI.getServers().stream().anyMatch(s -> s.getUrl().contains("staging"));
        boolean hasProd = openAPI.getServers().stream().anyMatch(s -> s.getUrl().contains("api.alight.com"));
        assertTrue(hasStaging, "Staging server must be present");
        assertTrue(hasProd, "Production server must be present");
    }

    @Test
    @DisplayName("Should verify 6 Swagger UI GroupedOpenApi definitions are active")
    void testGroupedOpenApisConfigured() {
        assertNotNull(groupedOpenApis);
        assertTrue(groupedOpenApis.size() >= 6, "Expected 6 GroupedOpenApi beans, found: " + groupedOpenApis.size());

        List<String> groupNames = groupedOpenApis.stream().map(GroupedOpenApi::getGroup).toList();
        assertTrue(groupNames.contains("01-All-Marketplace-APIs"));
        assertTrue(groupNames.contains("02-Storefront-Public-APIs"));
        assertTrue(groupNames.contains("03-Customer-Account-APIs"));
        assertTrue(groupNames.contains("04-Vendor-Portal-APIs"));
        assertTrue(groupNames.contains("05-Admin-Operations-APIs"));
        assertTrue(groupNames.contains("06-System-Diagnostics-APIs"));
    }
}
