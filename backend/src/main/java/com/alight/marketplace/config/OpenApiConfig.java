package com.alight.marketplace.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI alightMarketplaceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Alight International Multi-Vendor Marketplace API")
                        .description("Production-oriented modular monolith REST APIs for the Alight International multi-vendor hardware & home fittings marketplace platform.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Alight International Engineering")
                                .email("dev@alight.com")
                                .url("https://alight.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://alight.com/terms")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local Development Server"),
                        new Server().url("https://api-staging.alight.com").description("Staging Environment"),
                        new Server().url("https://api.alight.com").description("Production Environment")
                ))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT Bearer token to authorize requests (e.g. 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')")));
    }

    @Bean
    public GroupedOpenApi allApis() {
        return GroupedOpenApi.builder()
                .group("01-All-Marketplace-APIs")
                .pathsToMatch("/api/v1/**")
                .build();
    }

    @Bean
    public GroupedOpenApi storefrontApi() {
        return GroupedOpenApi.builder()
                .group("02-Storefront-Public-APIs")
                .pathsToMatch(
                        "/api/v1/products/**",
                        "/api/v1/categories/**",
                        "/api/v1/brands/**",
                        "/api/v1/cart/**",
                        "/api/v1/search/**",
                        "/api/v1/reviews/**",
                        "/api/v1/qa/**",
                        "/api/v1/bundles/**",
                        "/api/v1/quotes/**",
                        "/api/v1/coupons/**",
                        "/api/v1/promotions/**"
                )
                .build();
    }

    @Bean
    public GroupedOpenApi customerApi() {
        return GroupedOpenApi.builder()
                .group("03-Customer-Account-APIs")
                .pathsToMatch(
                        "/api/v1/auth/**",
                        "/api/v1/users/**",
                        "/api/v1/orders/**",
                        "/api/v1/checkout/**",
                        "/api/v1/payments/**",
                        "/api/v1/returns/**",
                        "/api/v1/wishlists/**",
                        "/api/v1/support/**",
                        "/api/v1/notifications/**"
                )
                .build();
    }

    @Bean
    public GroupedOpenApi vendorApi() {
        return GroupedOpenApi.builder()
                .group("04-Vendor-Portal-APIs")
                .pathsToMatch(
                        "/api/v1/vendor/**",
                        "/api/v1/vendors/**"
                )
                .build();
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("05-Admin-Operations-APIs")
                .pathsToMatch(
                        "/api/v1/admin/**"
                )
                .build();
    }

    @Bean
    public GroupedOpenApi systemApi() {
        return GroupedOpenApi.builder()
                .group("06-System-Diagnostics-APIs")
                .pathsToMatch(
                        "/api/v1/health/**",
                        "/api/v1/currencies/**",
                        "/api/v1/taxes/**",
                        "/api/v1/pricing/**",
                        "/api/v1/audit/**"
                )
                .build();
    }
}
