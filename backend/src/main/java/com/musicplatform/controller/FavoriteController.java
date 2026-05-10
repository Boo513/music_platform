package com.musicplatform.controller;

import com.musicplatform.dto.*;
import com.musicplatform.security.UserPrincipal;
import com.musicplatform.service.FavoriteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{songId}")
    public ResponseEntity<ApiResponse<Void>> add(
            @PathVariable Long songId,
            @AuthenticationPrincipal UserPrincipal principal) {
        favoriteService.add(principal.getId(), songId);
        return ResponseEntity.ok(ApiResponse.ok("收藏成功", null));
    }

    @DeleteMapping("/{songId}")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable Long songId,
            @AuthenticationPrincipal UserPrincipal principal) {
        favoriteService.remove(principal.getId(), songId);
        return ResponseEntity.ok(ApiResponse.ok("已取消收藏", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageData<SongResponse>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(favoriteService.list(principal.getId(), page, size)));
    }

    @GetMapping("/check/{songId}")
    public ResponseEntity<ApiResponse<FavoriteCheckResponse>> check(
            @PathVariable Long songId,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean fav = favoriteService.isFavorited(principal.getId(), songId);
        return ResponseEntity.ok(ApiResponse.ok(new FavoriteCheckResponse(fav)));
    }
}
