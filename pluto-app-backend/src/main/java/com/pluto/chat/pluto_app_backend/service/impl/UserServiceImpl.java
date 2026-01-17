package com.pluto.chat.pluto_app_backend.service.impl;
import com.pluto.chat.pluto_app_backend.dto.ProfileResponse;
import com.pluto.chat.pluto_app_backend.dto.UpdateProfileRequest;
import com.pluto.chat.pluto_app_backend.dto.ChangePasswordRequest;
import com.pluto.chat.pluto_app_backend.dto.AuthResponse;
import com.pluto.chat.pluto_app_backend.dto.LoginRequest;
import com.pluto.chat.pluto_app_backend.dto.RegisterRequest;
import com.pluto.chat.pluto_app_backend.entities.User;
import com.pluto.chat.pluto_app_backend.repository.UserRepository;
import com.pluto.chat.pluto_app_backend.service.JwtService;
import com.pluto.chat.pluto_app_backend.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserServiceImpl(UserRepository userRepository, 
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        // Check if username already exists
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Validate password strength
        if (request.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        // Create new user
        User user = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .createdAt(LocalDateTime.now())
                .joinedRooms(new ArrayList<>())
                .build();

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtService.generateToken(savedUser.getUsername());

        return AuthResponse.builder()
                .token(token)
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .userId(savedUser.getId())
                .message("User registered successfully")
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        // Find user by username
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        // Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password");
        }

        // Generate JWT token
        String token = jwtService.generateToken(user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .userId(user.getId())
                .message("Login successful")
                .build();
    }

    @Override
    public User loginOrCreateUser(String username) {
        String normalized = username.trim();
        
        Optional<User> existingUser = userRepository.findByUsername(normalized);
        
        if (existingUser.isPresent()) {
            return existingUser.get();
        }
        
        User newUser = User.builder()
                .username(normalized)
                .joinedRooms(new ArrayList<>())
                .build();
        
        return userRepository.save(newUser);
    }

    @Override
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username.trim());
    }

    @Override
    public User addRoomToUser(String username, String roomId) {
        User user = getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        
        String normalizedRoomId = roomId.toLowerCase().trim();
        
        if (!user.getJoinedRooms().contains(normalizedRoomId)) {
            user.getJoinedRooms().add(normalizedRoomId);
            return userRepository.save(user);
        }
        
        return user;
    }
    @Override
    public ProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .joinedRooms(user.getJoinedRooms())
                .totalRooms(user.getJoinedRooms() != null ? user.getJoinedRooms().size() : 0)
                .build();
    }

    @Override
    public ProfileResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update username if provided and different
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            String newUsername = request.getUsername().trim();
            
            // Check if new username is different from current
            if (!newUsername.equals(user.getUsername())) {
                // Check if new username is already taken
                if (userRepository.findByUsername(newUsername).isPresent()) {
                    throw new RuntimeException("Username already taken");
                }
                user.setUsername(newUsername);
            }
        }

        // Update email if provided and different
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            
            // Check if new email is different from current
            if (!newEmail.equals(user.getEmail())) {
                // Check if new email is already taken
                if (userRepository.findByEmail(newEmail).isPresent()) {
                    throw new RuntimeException("Email already taken");
                }
                user.setEmail(newEmail);
            }
        }

        User updatedUser = userRepository.save(user);

        return ProfileResponse.builder()
                .id(updatedUser.getId())
                .username(updatedUser.getUsername())
                .email(updatedUser.getEmail())
                .createdAt(updatedUser.getCreatedAt())
                .joinedRooms(updatedUser.getJoinedRooms())
                .totalRooms(updatedUser.getJoinedRooms() != null ? updatedUser.getJoinedRooms().size() : 0)
                .build();
    }

    @Override
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Validate new password
        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        // Check if new password is same as current
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public void deleteAccount(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify password before deletion
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Password is incorrect");
        }

        userRepository.delete(user);
    }

}