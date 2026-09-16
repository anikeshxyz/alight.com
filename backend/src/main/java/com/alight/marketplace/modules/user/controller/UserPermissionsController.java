package com.alight.marketplace.modules.user.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.user.dto.RbacDtos.UserEffectivePermissionsDto;
import com.alight.marketplace.modules.user.service.RbacService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
@Tag(name = "User Permissions & Roles", description = "Endpoints for inspecting current authenticated user RBAC context")
public class UserPermissionsController {

    private final RbacService rbacService;

    @GetMapping("/permissions")
    @Operation(summary = "Get current authenticated user permissions matrix", description = "Returns active roles, resolved permission keys, and vendor context")
    public ResponseEntity<ApiResponse<UserEffectivePermissionsDto>> getMyPermissions(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new UnauthorizedException("Authentication required to inspect active permissions");
        }
        UserEffectivePermissionsDto dto = rbacService.getCurrentUserEffectivePermissions(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
