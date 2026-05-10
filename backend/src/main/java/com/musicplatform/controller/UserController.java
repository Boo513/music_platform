package com.musicplatform.controller;

import com.musicplatform.dto.ApiResponse;
import com.musicplatform.dto.UserInfo;
import com.musicplatform.security.UserPrincipal;
import com.musicplatform.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserInfo>> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserInfo(principal.getId())));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserInfo>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateProfileRequest body) {
        userService.updateProfile(principal.getId(), body.nickname());
        return ResponseEntity.ok(ApiResponse.ok("更新成功", userService.getUserInfo(principal.getId())));
    }

    record UpdateProfileRequest(String nickname) {}

}
