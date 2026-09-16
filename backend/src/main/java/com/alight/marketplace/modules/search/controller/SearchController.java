package com.alight.marketplace.modules.search.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.search.dto.SearchResultDto;
import com.alight.marketplace.modules.search.dto.SearchSuggestionDto;
import com.alight.marketplace.modules.search.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Advanced Search", description = "Full-text product search with faceted filtering, stock availability, and autocomplete suggestions")
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    @Operation(summary = "Full-text product search with faceted filters",
               description = "Search products with optional category, brand, vendor, price range, stock availability, rating filters and sort options")
    public ResponseEntity<ApiResponse<SearchResultDto>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID brandId,
            @RequestParam(required = false) UUID vendorId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "relevance") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size
    ) {
        SearchResultDto result = searchService.search(q, categoryId, brandId, vendorId,
                minPrice, maxPrice, minRating, inStock, sort, page, Math.min(size, 48));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/suggestions")
    @Operation(summary = "Autocomplete typeahead suggestions",
               description = "Returns up to 8 product title suggestions matching the search prefix (min 2 chars)")
    public ResponseEntity<ApiResponse<List<SearchSuggestionDto>>> getSuggestions(
            @RequestParam String q
    ) {
        List<SearchSuggestionDto> suggestions = searchService.getSuggestions(q);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }
}
