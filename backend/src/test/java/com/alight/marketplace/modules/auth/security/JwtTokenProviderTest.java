package com.alight.marketplace.modules.auth.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        properties.setAccessExpirationMs(3600000);
        properties.setRefreshExpirationMs(86400000);
        jwtTokenProvider = new JwtTokenProvider(properties);
    }

    @Test
    @DisplayName("Should generate valid JWT token and parse username and roles")
    void testTokenGenerationAndParsing() {
        String token = jwtTokenProvider.generateToken("testuser@alight.com", List.of("ROLE_CUSTOMER", "ROLE_VENDOR"), Map.of("tenant", "india"));

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("testuser@alight.com", jwtTokenProvider.getUsernameFromToken(token));

        List<String> roles = jwtTokenProvider.getRolesFromToken(token);
        assertEquals(2, roles.size());
        assertTrue(roles.contains("ROLE_CUSTOMER"));
        assertTrue(roles.contains("ROLE_VENDOR"));
    }

    @Test
    @DisplayName("Should return false for invalid or malformed token")
    void testInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid.jwt.token"));
    }
}
