package com.safora.backend.service;

import com.safora.backend.dto.AuthResponse;
import com.safora.backend.dto.LoginRequest;
import com.safora.backend.dto.RegisterRequest;
import com.safora.backend.model.User;
import com.safora.backend.repository.UserRepository;
import com.safora.backend.security.JwtService;
import com.safora.backend.exception.BadRequestException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

        private final UserRepository userRepository;

        private final PasswordEncoder passwordEncoder;

        private final JwtService jwtService;

        public AuthService(
                        UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        JwtService jwtService) {

                this.userRepository = userRepository;

                this.passwordEncoder = passwordEncoder;

                this.jwtService = jwtService;
        }

        public AuthResponse register(
                        RegisterRequest request) {

                String email = request.getEmail()
                                .trim()
                                .toLowerCase();

                if (userRepository.existsByEmail(
                                email)) {

                        throw new BadRequestException(
                                        "Email already registered");
                }

                User user = new User();

                user.setName(
                                request.getName()
                                                .trim());

                user.setEmail(
                                email);

                user.setPassword(
                                passwordEncoder.encode(
                                                request.getPassword()));

                User savedUser = userRepository.save(
                                user);

                String token = jwtService.createToken(
                                savedUser.getEmail());

                return new AuthResponse(
                                token,
                                savedUser.getId(),
                                savedUser.getName(),
                                savedUser.getEmail());
        }

        public AuthResponse login(
                        LoginRequest request) {

                if (request.getEmail() == null ||
                                request.getEmail().trim().isEmpty()) {

                        throw new BadRequestException(
                                        "Email is required");
                }

                if (request.getPassword() == null ||
                                request.getPassword().isEmpty()) {

                        throw new BadRequestException(
                                        "Password is required");
                }

                String email = request.getEmail()
                                .trim()
                                .toLowerCase();

                User user = userRepository
                                .findByEmail(
                                                email)
                                .orElseThrow(
                                                () -> new BadRequestException(
                                                                "Invalid email or password"));

                boolean passwordMatches = passwordEncoder.matches(
                                request.getPassword(),
                                user.getPassword());

                if (!passwordMatches) {

                        throw new BadRequestException(
                                        "Invalid email or password");
                }

                String token = jwtService.createToken(
                                user.getEmail());

                return new AuthResponse(
                                token,
                                user.getId(),
                                user.getName(),
                                user.getEmail());
        }
}