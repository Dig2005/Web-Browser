package com.safora.backend.exception;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(BadRequestException.class)
        public ResponseEntity<ApiError> handleBadRequest(BadRequestException exception, HttpServletRequest request) {
                ApiError error = new ApiError(HttpStatus.BAD_REQUEST.value(), exception.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiError> handleValidation(
                        MethodArgumentNotValidException exception,
                        HttpServletRequest request) {

                String message = exception
                                .getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .findFirst()
                                .map(
                                                error -> error.getDefaultMessage())
                                .orElse(
                                                "Invalid request data");

                ApiError error = new ApiError(
                                HttpStatus.BAD_REQUEST.value(),
                                message,
                                request.getRequestURI());

                return ResponseEntity
                                .status(
                                                HttpStatus.BAD_REQUEST)
                                .body(
                                                error);
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception,
                        HttpServletRequest request) {
                ApiError error = new ApiError(HttpStatus.NOT_FOUND.value(), exception.getMessage(),
                                request.getRequestURI());

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiError> handleGeneralException(Exception exception, HttpServletRequest request) {

                ApiError error = new ApiError(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Something went wrong on the server.", request.getRequestURI());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
}