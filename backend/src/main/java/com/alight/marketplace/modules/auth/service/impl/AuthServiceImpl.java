package com.alight.marketplace.modules.auth.service.impl;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.modules.auth.dto.*;
import com.alight.marketplace.modules.auth.entity.EmailVerificationToken;
import com.alight.marketplace.modules.auth.entity.PasswordResetToken;
import com.alight.marketplace.modules.auth.entity.RefreshToken;
import com.alight.marketplace.modules.auth.repository.EmailVerificationTokenRepository;
import com.alight.marketplace.modules.auth.repository.PasswordResetTokenRepository;
import com.alight.marketplace.modules.auth.repository.RefreshTokenRepository;
import com.alight.marketplace.modules.auth.security.JwtProperties;
import com.alight.marketplace.modules.auth.security.JwtTokenProvider;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.user.dto.UserProfileDto;
import com.alight.marketplace.modules.user.entity.Permission;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.RoleRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 15;
    private static final long PASSWORD_RESET_EXPIRY_SECONDS = 3600; // 1 hour
    private static final long EMAIL_VERIFICATION_EXPIRY_SECONDS = 86400; // 24 hours

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with email " + request.getEmail() + " already exists");
        }

        final String targetRoleName = "VENDOR".equalsIgnoreCase(request.getAccountType())
                ? "ROLE_VENDOR"
                : "ROLE_CUSTOMER";

        Role assignedRole = roleRepository.findByName(targetRoleName)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(targetRoleName)
                        .description("Auto-provisioned " + targetRoleName)
                        .build()));

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(request.getPhone())
                .active(true)
                .emailVerified(false)
                .phoneVerified(false)
                .roles(new HashSet<>(Set.of(assignedRole)))
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new user with email: {} and role: {}", savedUser.getEmail(), targetRoleName);

        // Generate email verification token for the newly registered user
        createEmailVerificationToken(savedUser);

        return buildAuthResponse(savedUser);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password credentials"));

        if (!user.isActive()) {
            throw new BusinessRuleException("Your account is currently disabled. Please contact support.");
        }

        if (user.isAccountLocked()) {
            throw new BusinessRuleException("Account is temporarily locked due to multiple failed login attempts. Please try again later.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.recordFailedLogin(MAX_FAILED_ATTEMPTS, LOCK_DURATION_MINUTES);
            userRepository.save(user);

            if (user.isAccountLocked()) {
                log.warn("Account locked for user {} after {} consecutive failed login attempts", user.getEmail(), MAX_FAILED_ATTEMPTS);
                throw new BusinessRuleException("Account has been locked for 15 minutes due to 5 consecutive failed login attempts.");
            }
            throw new UnauthorizedException("Invalid email or password credentials");
        }

        user.recordSuccessfulLogin();
        userRepository.save(user);

        log.info("User logged in successfully: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid or unrecognized refresh token"));

        if (refreshToken.isRevoked() || refreshToken.isExpired()) {
            throw new UnauthorizedException("Refresh token has expired or has been revoked");
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User associated with refresh token not found"));

        if (!user.isActive()) {
            throw new BusinessRuleException("User account is inactive");
        }

        // Rotate Refresh Token
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            refreshTokenRepository.revokeAllByUserId(user.getId());
            log.info("Revoked all active refresh tokens for user: {}", email);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToProfileDto(user);
    }

    @Override
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().toLowerCase().trim());
        if (userOpt.isEmpty()) {
            // Return generic token placeholder / log to avoid email enumeration
            log.info("Password reset requested for non-existent email: {}", request.getEmail());
            return "If the account exists, a password reset token has been generated.";
        }

        User user = userOpt.get();
        passwordResetTokenRepository.invalidateAllActiveForUser(user.getId());

        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(PASSWORD_RESET_EXPIRY_SECONDS))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);
        log.info("Generated password reset token for user: {}", user.getEmail());
        return token;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BusinessRuleException("Invalid or expired password reset token"));

        if (resetToken.isUsed() || resetToken.isExpired()) {
            throw new BusinessRuleException("Password reset token has expired or has already been used");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Invalidate all active refresh tokens/sessions across devices
        refreshTokenRepository.revokeAllByUserId(user.getId());
        log.info("Password successfully reset for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        refreshTokenRepository.revokeAllByUserId(user.getId());
        log.info("Password successfully changed for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BusinessRuleException("Invalid or expired email verification token"));

        if (verificationToken.isUsed() || verificationToken.isExpired()) {
            throw new BusinessRuleException("Email verification token has expired or has already been used");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);
        log.info("Email successfully verified for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public String resendEmailVerification(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isEmailVerified()) {
            throw new BusinessRuleException("Email address is already verified");
        }

        emailVerificationTokenRepository.invalidateAllActiveForUser(user.getId());
        EmailVerificationToken token = createEmailVerificationToken(user);
        return token.getToken();
    }

    private EmailVerificationToken createEmailVerificationToken(User user) {
        String tokenStr = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        EmailVerificationToken token = EmailVerificationToken.builder()
                .token(tokenStr)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(EMAIL_VERIFICATION_EXPIRY_SECONDS))
                .used(false)
                .build();
        return emailVerificationTokenRepository.save(token);
    }

    private AuthResponse buildAuthResponse(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        List<String> permissions = user.getRoles().stream()
                .filter(r -> r.getPermissions() != null)
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getName)
                .distinct()
                .toList();

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());

        String accessToken = jwtTokenProvider.generateToken(user.getEmail(), roleNames, permissions, claims);

        // Generate and persist refresh token
        String rawRefreshToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(user.getId())
                .token(rawRefreshToken)
                .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessExpirationMs() / 1000)
                .user(mapToProfileDto(user))
                .roles(roleNames)
                .permissions(permissions)
                .build();
    }

    private UserProfileDto mapToProfileDto(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .emailVerified(user.isEmailVerified())
                .phoneVerified(user.isPhoneVerified())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
