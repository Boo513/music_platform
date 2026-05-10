package com.musicplatform.controller;

import com.musicplatform.dto.*;
import com.musicplatform.security.UserPrincipal;
import com.musicplatform.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserInfo>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("注册成功", authService.register(req)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("登录成功", authService.login(req)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserInfo>> me(@AuthenticationPrincipal UserPrincipal principal) {
        UserInfo info = new UserInfo();
        info.setId(principal.getId());
        info.setUsername(principal.getUsername());
        info.setNickname(principal.getNickname());
        return ResponseEntity.ok(ApiResponse.ok(info));
    }
}
