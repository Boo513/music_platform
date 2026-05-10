package com.musicplatform.controller;

import com.musicplatform.dto.*;
import com.musicplatform.security.UserPrincipal;
import com.musicplatform.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlaylistResponse>> create(
            @Valid @RequestBody PlaylistCreateRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("创建成功",
                playlistService.create(req.getName(), req.getDescription(), req.getIsPublic(), principal.getId())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlaylistResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(playlistService.listByUser(principal.getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaylistResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok(playlistService.getById(id, userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaylistResponse>> update(
            @PathVariable Long id,
            @RequestBody PlaylistCreateRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("更新成功",
                playlistService.update(id, req.getName(), req.getDescription(), req.getIsPublic(), principal.getId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        playlistService.delete(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("删除成功", null));
    }

    @PostMapping("/{id}/songs")
    public ResponseEntity<ApiResponse<Void>> addSong(
            @PathVariable Long id,
            @Valid @RequestBody AddSongRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        playlistService.addSong(id, req.getSongId(), principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("添加成功", null));
    }

    @DeleteMapping("/{id}/songs/{songId}")
    public ResponseEntity<ApiResponse<Void>> removeSong(
            @PathVariable Long id,
            @PathVariable Long songId,
            @AuthenticationPrincipal UserPrincipal principal) {
        playlistService.removeSong(id, songId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("移除成功", null));
    }
}
