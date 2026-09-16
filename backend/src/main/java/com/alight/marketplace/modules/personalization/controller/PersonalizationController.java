package com.alight.marketplace.modules.personalization.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.personalization.dto.PersonalizationOverviewDto;
import com.alight.marketplace.modules.personalization.service.PersonalizationService;
import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import com.alight.marketplace.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/personalization")
@RequiredArgsConstructor
@Tag(name = "Personalization", description = "Recently viewed and tailored product discovery")
public class PersonalizationController {

    private final PersonalizationService personalizationService;
    private final UserRepository userRepository;

    private UUID getUserId(Principal principal) {
        if (principal == null) throw new UnauthorizedException("Authentication required");
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UnauthorizedException("User not found"))
                .getId();
    }

    @PostMapping("/views/{productId}")
    @Operation(summary = "Record a product view for the signed-in customer")
    public ResponseEntity<ApiResponse<Void>> recordView(Principal principal, @PathVariable UUID productId) {
        personalizationService.recordProductView(getUserId(principal), productId);
        return ResponseEntity.ok(ApiResponse.success(null, "Product view recorded"));
    }

    @GetMapping("/recently-viewed")
    @Operation(summary = "Get recently viewed products")
    public ResponseEntity<ApiResponse<List<ProductSummaryDto>>> recentlyViewed(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(personalizationService.getRecentlyViewed(getUserId(principal))));
    }

    @GetMapping("/recommendations")
    @Operation(summary = "Get products recommended for the signed-in customer")
    public ResponseEntity<ApiResponse<List<ProductSummaryDto>>> recommendations(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(personalizationService.getRecommended(getUserId(principal))));
    }

    @GetMapping("/overview")
    @Operation(summary = "Get the complete personalized discovery overview")
    public ResponseEntity<ApiResponse<PersonalizationOverviewDto>> overview(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(personalizationService.getOverview(getUserId(principal))));
    }

    @GetMapping("/trending")
    @Operation(summary = "Get public trending products")
    public ResponseEntity<ApiResponse<List<ProductSummaryDto>>> trending() {
        return ResponseEntity.ok(ApiResponse.success(personalizationService.getTrending()));
    }
}
