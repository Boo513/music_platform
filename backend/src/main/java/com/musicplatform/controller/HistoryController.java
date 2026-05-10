package com.musicplatform.controller;

import com.musicplatform.dto.*;
import com.musicplatform.security.UserPrincipal;
import com.musicplatform.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @PostMapping("/{songId}")
    public ResponseEntity<ApiResponse<Void>> record(
            @PathVariable Long songId,
            @AuthenticationPrincipal UserPrincipal principal) {
        historyService.record(principal.getId(), songId);
        return ResponseEntity.ok(ApiResponse.ok("记录成功", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageData<PlayHistoryResponse>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(historyService.list(principal.getId(), page, size)));
    }
}
