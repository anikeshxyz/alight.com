package com.alight.marketplace.modules.auth.controller;

import com.alight.marketplace.common.exception.GlobalExceptionHandler;
import com.alight.marketplace.modules.auth.dto.AuthResponse;
import com.alight.marketplace.modules.auth.dto.LoginRequest;
import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.user.dto.UserProfileDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@ContextConfiguration(classes = {AuthController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    private Principal createMockPrincipal(String email) {
        return new UsernamePasswordAuthenticationToken(email, "pass", List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register should return 201 Created with AuthResponse")
    void testRegisterEndpoint() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("newuser@alight.com")
                .password("SecurePass123")
                .firstName("Alex")
                .lastName("Taylor")
                .accountType("CUSTOMER")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mock_access_token")
                .refreshToken("mock_refresh_token")
                .expiresIn(86400)
                .roles(List.of("ROLE_CUSTOMER"))
                .user(UserProfileDto.builder()
                        .id(UUID.randomUUID())
                        .email("newuser@alight.com")
                        .firstName("Alex")
                        .lastName("Taylor")
                        .roles(List.of("ROLE_CUSTOMER"))
                        .build())
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Account registered successfully"))
                .andExpect(jsonPath("$.data.accessToken").value("mock_access_token"))
                .andExpect(jsonPath("$.data.user.email").value("newuser@alight.com"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should return 200 OK with tokens")
    void testLoginEndpoint() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("user@alight.com")
                .password("Password123!")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken("mock_login_token")
                .refreshToken("mock_refresh_token")
                .expiresIn(86400)
                .roles(List.of("ROLE_CUSTOMER"))
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mock_login_token"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me should return current user profile")
    void testGetMeEndpoint() throws Exception {
        UserProfileDto profile = UserProfileDto.builder()
                .id(UUID.randomUUID())
                .email("user@alight.com")
                .firstName("Alex")
                .lastName("Taylor")
                .roles(List.of("ROLE_CUSTOMER"))
                .build();

        when(authService.getCurrentUser("user@alight.com")).thenReturn(profile);

        mockMvc.perform(get("/api/v1/auth/me")
                        .principal(createMockPrincipal("user@alight.com"))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("user@alight.com"));
    }
}
