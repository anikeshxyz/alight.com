package com.alight.marketplace.modules.auth;

import com.alight.marketplace.common.security.ResourceSecurityService;
import com.alight.marketplace.modules.auth.security.JwtProperties;
import com.alight.marketplace.modules.auth.security.JwtTokenProvider;
import com.alight.marketplace.modules.user.dto.RbacDtos.*;
import com.alight.marketplace.modules.user.entity.Permission;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.PermissionRepository;
import com.alight.marketplace.modules.user.repository.RoleRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.user.service.RbacService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class RbacAndResourceIsolationIntegrationTest {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RbacService rbacService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ResourceSecurityService securityService;

    @Test
    @DisplayName("Should verify presence of all 4 marketplace roles in database")
    void testAllRolesExistInDatabase() {
        List<Role> roles = roleRepository.findAll();
        assertTrue(roles.size() >= 4, "Expected at least 4 roles in database");

        assertTrue(roleRepository.findByName("ROLE_CUSTOMER").isPresent(), "ROLE_CUSTOMER must exist");
        assertTrue(roleRepository.findByName("ROLE_VENDOR").isPresent(), "ROLE_VENDOR must exist");
        assertTrue(roleRepository.findByName("ROLE_ADMIN").isPresent(), "ROLE_ADMIN must exist");
        assertTrue(roleRepository.findByName("ROLE_SUPER_ADMIN").isPresent(), "ROLE_SUPER_ADMIN must exist");
    }

    @Test
    @DisplayName("Should verify 40+ granular system permissions in database")
    void testGranularPermissionsExist() {
        List<Permission> permissions = permissionRepository.findAll();
        assertTrue(permissions.size() >= 40, "Expected at least 40 granular permissions, found: " + permissions.size());

        assertTrue(permissionRepository.existsByName("catalog:read"));
        assertTrue(permissionRepository.existsByName("catalog:create"));
        assertTrue(permissionRepository.existsByName("catalog:approve"));
        assertTrue(permissionRepository.existsByName("order:read_vendor"));
        assertTrue(permissionRepository.existsByName("vendor:verify_approve"));
        assertTrue(permissionRepository.existsByName("settlement:payout_approve"));
        assertTrue(permissionRepository.existsByName("system:user_role_manage"));
    }

    @Test
    @DisplayName("Should verify role permission bindings in database")
    void testRolePermissionBindings() {
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER").orElseThrow();
        Set<Permission> customerPerms = customerRole.getPermissions();
        assertFalse(customerPerms.isEmpty(), "Customer role should have bound permissions");
        assertTrue(customerPerms.stream().anyMatch(p -> "catalog:read".equals(p.getName())));
        assertTrue(customerPerms.stream().noneMatch(p -> "catalog:approve".equals(p.getName())), "Customer must not have catalog:approve");

        Role vendorRole = roleRepository.findByName("ROLE_VENDOR").orElseThrow();
        Set<Permission> vendorPerms = vendorRole.getPermissions();
        assertTrue(vendorPerms.stream().anyMatch(p -> "catalog:create".equals(p.getName())));
        assertTrue(vendorPerms.stream().anyMatch(p -> "order:read_vendor".equals(p.getName())));

        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseThrow();
        Set<Permission> adminPerms = adminRole.getPermissions();
        assertTrue(adminPerms.stream().anyMatch(p -> "catalog:approve".equals(p.getName())));
        assertTrue(adminPerms.stream().anyMatch(p -> "vendor:verify_approve".equals(p.getName())));
    }

    @Test
    @DisplayName("Should verify Super Administrator account configuration")
    void testSuperAdminAccount() {
        Optional<User> superAdminOpt = userRepository.findByEmail("superadmin@alight.com");
        assertTrue(superAdminOpt.isPresent(), "Super Admin user should exist in database");

        User superAdmin = superAdminOpt.get();
        assertTrue(superAdmin.getRoles().stream().anyMatch(r -> "ROLE_SUPER_ADMIN".equals(r.getName())));

        UserEffectivePermissionsDto effective = rbacService.getCurrentUserEffectivePermissions(superAdmin.getEmail());
        assertTrue(effective.isSuperAdmin());
        assertTrue(effective.isAdmin());
        assertTrue(effective.getPermissions().size() >= 40, "Super Admin should inherit all system permissions");
    }

    @Test
    @DisplayName("Should test JWT token generation with embedded permissions and extraction")
    void testJwtTokenPermissionsEmbedding() {
        List<String> roles = List.of("ROLE_VENDOR", "ROLE_CUSTOMER");
        List<String> permissions = List.of("catalog:read", "catalog:create", "order:read_vendor");
        Map<String, Object> claims = Map.of("userId", "a0000000-0000-0000-0000-000000000002");

        String token = jwtTokenProvider.generateToken("seller@alight.com", roles, permissions, claims);
        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));

        assertEquals("seller@alight.com", jwtTokenProvider.getUsernameFromToken(token));
        assertEquals(roles, jwtTokenProvider.getRolesFromToken(token));
        assertEquals(permissions, jwtTokenProvider.getPermissionsFromToken(token));
        assertEquals("a0000000-0000-0000-0000-000000000002", jwtTokenProvider.getUserIdFromToken(token));
    }

    @Test
    @DisplayName("Should test RbacService user role mutation and permission resolution")
    void testRbacServiceRoleMutation() {
        User user = userRepository.findByEmail("customer@alight.com").orElseThrow();
        assertEquals(1, user.getRoles().size());

        UserEffectivePermissionsDto updated = rbacService.updateUserRoles(
                user.getId(),
                Set.of("ROLE_CUSTOMER", "ROLE_VENDOR")
        );

        assertNotNull(updated);
        assertTrue(updated.getRoles().contains("ROLE_VENDOR"));
        assertTrue(updated.getRoles().contains("ROLE_CUSTOMER"));
        assertTrue(updated.getPermissions().contains("catalog:create"));
    }

    @Test
    @DisplayName("Should test RbacService retrieving all roles and permissions")
    void testRbacServiceListing() {
        List<RoleDetailDto> roles = rbacService.getAllRoles();
        assertTrue(roles.size() >= 4);

        List<PermissionDto> permissions = rbacService.getAllPermissions();
        assertTrue(permissions.size() >= 40);
        assertTrue(permissions.stream().anyMatch(p -> "catalog".equals(p.getDomain())));
    }
}
