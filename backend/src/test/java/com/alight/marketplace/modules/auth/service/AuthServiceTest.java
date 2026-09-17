package com.alight.marketplace.modules.auth.service;

import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.modules.auth.dto.AuthResponse;
import com.alight.marketplace.modules.auth.dto.LoginRequest;
import com.alight.marketplace.modules.auth.dto.RefreshTokenRequest;
import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.entity.RefreshToken;
import com.alight.marketplace.modules.auth.repository.RefreshTokenRepository;
import com.alight.marketplace.modules.auth.security.JwtProperties;
import com.alight.marketplace.modules.auth.security.JwtTokenProvider;
import com.alight.marketplace.modules.auth.service.impl.AuthServiceImpl;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.auth.repository.PasswordResetTokenRepository;
import com.alight.marketplace.modules.auth.repository.EmailVerificationTokenRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.RoleRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtProperties jwtProperties;

    @Mock
    private com.alight.marketplace.modules.vendor.repository.VendorRepository vendorRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        customerRole = Role.builder()
                .id(UUID.randomUUID())
                .name("ROLE_CUSTOMER")
                .description("Customer role")
                .build();

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@alight.com")
                .passwordHash("hashed_pw")
                .firstName("John")
                .lastName("Doe")
                .active(true)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build();
    }

    @Test
    @DisplayName("Should successfully register a new customer user")
    void testRegisterSuccess() {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@alight.com")
                .password("Password123!")
                .firstName("John")
                .lastName("Doe")
                .accountType("CUSTOMER")
                .build();

        when(userRepository.existsByEmail("test@alight.com")).thenReturn(false);
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pw");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtProperties.getAccessExpirationMs()).thenReturn(86400000L);
        when(jwtProperties.getRefreshExpirationMs()).thenReturn(604800000L);
        when(jwtTokenProvider.generateToken(anyString(), any(), any(), any())).thenReturn("mock_access_jwt");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock_access_jwt", response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("test@alight.com", response.getUser().getEmail());
        assertTrue(response.getRoles().contains("ROLE_CUSTOMER"));
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when email is already registered")
    void testRegisterDuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@alight.com")
                .password("Password123!")
                .firstName("John")
                .lastName("Doe")
                .build();

        when(userRepository.existsByEmail("test@alight.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should successfully login with valid credentials")
    void testLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .email("test@alight.com")
                .password("Password123!")
                .build();

        when(userRepository.findByEmail("test@alight.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password123!", "hashed_pw")).thenReturn(true);
        when(jwtProperties.getAccessExpirationMs()).thenReturn(86400000L);
        when(jwtProperties.getRefreshExpirationMs()).thenReturn(604800000L);
        when(jwtTokenProvider.generateToken(anyString(), any(), any(), any())).thenReturn("mock_login_jwt");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock_login_jwt", response.getAccessToken());
        assertEquals("test@alight.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when login password is incorrect")
    void testLoginInvalidPassword() {
        LoginRequest request = LoginRequest.builder()
                .email("test@alight.com")
                .password("WrongPassword")
                .build();

        when(userRepository.findByEmail("test@alight.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "hashed_pw")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should refresh token successfully with valid non-expired refresh token")
    void testRefreshTokenSuccess() {
        RefreshToken token = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(sampleUser.getId())
                .token("valid-refresh-token")
                .expiresAt(Instant.now().plusSeconds(3600))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(token));
        when(userRepository.findById(sampleUser.getId())).thenReturn(Optional.of(sampleUser));
        when(jwtProperties.getAccessExpirationMs()).thenReturn(86400000L);
        when(jwtProperties.getRefreshExpirationMs()).thenReturn(604800000L);
        when(jwtTokenProvider.generateToken(anyString(), any(), any(), any())).thenReturn("new_access_jwt");

        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken("valid-refresh-token")
                .build();

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new_access_jwt", response.getAccessToken());
        assertTrue(token.isRevoked()); // Verify previous token was marked revoked
    }
}
