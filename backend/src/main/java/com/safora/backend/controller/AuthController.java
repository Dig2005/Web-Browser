package com.safora.backend.controller;

import com.safora.backend.dto.AuthResponse;
import com.safora.backend.dto.LoginRequest;
import com.safora.backend.dto.RegisterRequest;
import com.safora.backend.service.AuthService;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        private final AuthService authService;

        public AuthController(AuthService authService) {
                this.authService = authService;
        }

        @PostMapping("/register")
        public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
                AuthResponse response = authService.register(request);
                return ResponseEntity.ok(response);
        }

        @PostMapping("/login")
        public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
                AuthResponse response = authService.login(request);
                return ResponseEntity.ok(response);
        }
}