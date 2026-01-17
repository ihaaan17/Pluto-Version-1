package com.pluto.chat.pluto_app_backend.controller;

import com.pluto.chat.pluto_app_backend.dto.AuthResponse;
import com.pluto.chat.pluto_app_backend.dto.LoginRequest;
import com.pluto.chat.pluto_app_backend.dto.RegisterRequest;
import com.pluto.chat.pluto_app_backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            System.out.println("📝 Registration attempt: " + request.getUsername());
            AuthResponse response = userService.register(request);
            System.out.println("✅ User registered: " + request.getUsername());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("❌ Registration failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            System.out.println("🔐 Login attempt: " + request.getUsername());
            AuthResponse response = userService.login(request);
            System.out.println("✅ User logged in: " + request.getUsername());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("❌ Login failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    // Error response DTO
    record ErrorResponse(String error) {}
}