package com.alight.marketplace.modules.auth;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.modules.auth.dto.*;
import com.alight.marketplace.modules.auth.entity.EmailVerificationToken;
import com.alight.marketplace.modules.auth.entity.PasswordResetToken;
import com.alight.marketplace.modules.auth.repository.EmailVerificationTokenRepository;
import com.alight.marketplace.modules.auth.repository.PasswordResetTokenRepository;
import com.alight.marketplace.modules.auth.repository.RefreshTokenRepository;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class AuthenticationAndSessionIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String testEmail;
    private String testPassword;

    @BeforeEach
    void setUp() {
        testEmail = "auth_test_" + UUID.randomUUID().toString().substring(0, 8) + "@alight.com";
        testPassword = "SecurePassword123!";
    }

    @Test
    @DisplayName("Should register new customer user and create initial email verification token")
    void testUserRegistrationAndTokenCreation() {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(testEmail)
                .password(testPassword)
                .firstName("Test")
                .lastName("User")
                .phone("+1555123456")
                .accountType("CUSTOMER")
                .build();

        AuthResponse authResponse = authService.register(registerRequest);

        assertNotNull(authResponse);
        assertNotNull(authResponse.getAccessToken());
        assertNotNull(authResponse.getRefreshToken());
        assertEquals("Bearer", authResponse.getTokenType());
        assertEquals(testEmail, authResponse.getUser().getEmail());
        assertFalse(authResponse.getUser().isEmailVerified());

        User user = userRepository.findByEmail(testEmail).orElseThrow();
        assertTrue(passwordEncoder.matches(testPassword, user.getPasswordHash()));
        assertEquals(0, user.getFailedLoginAttempts());
        assertNull(user.getAccountLockedUntil());
    }

    @Test
    @DisplayName("Should enforce account lockout after 5 consecutive failed login attempts")
    void testAccountLockoutAfterFailedLogins() {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(testEmail)
                .password(testPassword)
                .firstName("Lockout")
                .lastName("Target")
                .accountType("CUSTOMER")
                .build();
        authService.register(registerRequest);

        LoginRequest badLogin = LoginRequest.builder()
                .email(testEmail)
                .password("WrongPassword999!")
                .build();

        // 4 failed attempts should throw UnauthorizedException
        for (int i = 1; i <= 4; i++) {
            assertThrows(UnauthorizedException.class, () -> authService.login(badLogin));
        }

        // 5th failed attempt triggers lockout
        BusinessRuleException lockoutEx = assertThrows(BusinessRuleException.class, () -> authService.login(badLogin));
        assertTrue(lockoutEx.getMessage().contains("locked"));

        User user = userRepository.findByEmail(testEmail).orElseThrow();
        assertTrue(user.isAccountLocked());
        assertEquals(5, user.getFailedLoginAttempts());
        assertNotNull(user.getAccountLockedUntil());
    }

    @Test
    @DisplayName("Should handle forgot-password flow and single-use reset token consumption")
    void testForgotPasswordAndResetFlow() {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(testEmail)
                .password(testPassword)
                .firstName("Reset")
                .lastName("Tester")
                .accountType("CUSTOMER")
                .build();
        authService.register(registerRequest);

        // 1. Request password reset
        String resetToken = authService.forgotPassword(ForgotPasswordRequest.builder().email(testEmail).build());
        assertNotNull(resetToken);

        PasswordResetToken tokenEntity = passwordResetTokenRepository.findByToken(resetToken).orElseThrow();
        assertFalse(tokenEntity.isUsed());
        assertFalse(tokenEntity.isExpired());

        // 2. Reset password
        String newPassword = "BrandNewPassword2026!";
        authService.resetPassword(ResetPasswordRequest.builder()
                .token(resetToken)
                .newPassword(newPassword)
                .build());

        // 3. Verify password was updated in DB
        User updatedUser = userRepository.findByEmail(testEmail).orElseThrow();
        assertTrue(passwordEncoder.matches(newPassword, updatedUser.getPasswordHash()));

        // 4. Token cannot be reused
        PasswordResetToken usedToken = passwordResetTokenRepository.findByToken(resetToken).orElseThrow();
        assertTrue(usedToken.isUsed());
        assertThrows(BusinessRuleException.class, () -> authService.resetPassword(ResetPasswordRequest.builder()
                .token(resetToken)
                .newPassword("AnotherPassword!")
                .build()));
    }

    @Test
    @DisplayName("Should verify user email address and mark token as consumed")
    void testEmailVerificationFlow() {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(testEmail)
                .password(testPassword)
                .firstName("Verify")
                .lastName("Email")
                .accountType("CUSTOMER")
                .build();
        authService.register(registerRequest);

        User user = userRepository.findByEmail(testEmail).orElseThrow();
        assertFalse(user.isEmailVerified());

        String verificationToken = authService.resendEmailVerification(testEmail);
        assertNotNull(verificationToken);

        authService.verifyEmail(VerifyEmailRequest.builder().token(verificationToken).build());

        User verifiedUser = userRepository.findByEmail(testEmail).orElseThrow();
        assertTrue(verifiedUser.isEmailVerified());

        EmailVerificationToken consumedToken = emailVerificationTokenRepository.findByToken(verificationToken).orElseThrow();
        assertTrue(consumedToken.isUsed());
    }

    @Test
    @DisplayName("Should rotate refresh tokens upon token refresh request")
    void testRefreshTokenRotation() {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(testEmail)
                .password(testPassword)
                .firstName("Token")
                .lastName("Rotate")
                .accountType("CUSTOMER")
                .build();
        AuthResponse initialAuth = authService.register(registerRequest);
        String oldRefreshToken = initialAuth.getRefreshToken();

        AuthResponse refreshedAuth = authService.refreshToken(RefreshTokenRequest.builder()
                .refreshToken(oldRefreshToken)
                .build());

        assertNotNull(refreshedAuth);
        assertNotNull(refreshedAuth.getAccessToken());
        assertNotNull(refreshedAuth.getRefreshToken());
        assertNotEquals(oldRefreshToken, refreshedAuth.getRefreshToken());

        // Reusing revoked refresh token must fail
        assertThrows(UnauthorizedException.class, () -> authService.refreshToken(RefreshTokenRequest.builder()
                .refreshToken(oldRefreshToken)
                .build()));
    }
}
