package com.musicplatform.controller;

import com.musicplatform.dto.*;
import com.musicplatform.exception.BusinessException;
import com.musicplatform.exception.ErrorCode;
import com.musicplatform.security.UserPrincipal;
import com.musicplatform.service.SongService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

@RestController
@RequestMapping("/api/songs")
public class SongController {

    private final SongService songService;

    public SongController(SongService songService) {
        this.songService = songService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageData<SongResponse>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String style,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "newest") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        boolean isAdmin = principal != null && "admin".equals(principal.getRole());
        return ResponseEntity.ok(ApiResponse.ok(songService.list(style, mood, keyword, sort, page, size, userId, isAdmin)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SongResponse>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok(songService.getById(id, userId)));
    }

    @GetMapping("/{id}/stream")
    public ResponseEntity<Resource> stream(@PathVariable Long id,
                                           @RequestHeader(value = "Range", required = false) String rangeHeader) {
        String filePath = songService.getStreamPath(id);
        try {
            Path path = Path.of(filePath);
            Resource resource = new FileSystemResource(path);
            long fileLength = resource.contentLength();

            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                return handleRangeRequest(rangeHeader, resource, fileLength);
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentLength(fileLength)
                    .body(resource);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
    }

    private ResponseEntity<Resource> handleRangeRequest(String rangeHeader, Resource resource, long fileLength) throws IOException {
        String rangeValue = rangeHeader.substring("bytes=".length());
        String[] parts = rangeValue.split(",")[0].split("-");
        long start = Long.parseLong(parts[0].trim());
        long end = parts.length > 1 && !parts[1].trim().isEmpty() ? Long.parseLong(parts[1].trim()) : fileLength - 1;

        if (start >= fileLength) {
            return ResponseEntity.status(416)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength)
                    .build();
        }

        end = Math.min(end, fileLength - 1);
        long contentLength = end - start + 1;

        // Read only the requested byte range
        byte[] data = new byte[(int) contentLength];
        try (java.io.RandomAccessFile raf = new java.io.RandomAccessFile(resource.getFile(), "r")) {
            raf.seek(start);
            raf.readFully(data);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_TYPE, "audio/mpeg");
        headers.add(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.add(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileLength);
        headers.setContentLength(contentLength);

        return ResponseEntity.status(206)
                .headers(headers)
                .body(new org.springframework.core.io.ByteArrayResource(data));
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<SongResponse>> upload(
            @RequestParam("title") String title,
            @RequestParam("artist") String artist,
            @RequestParam("style") String style,
            @RequestParam("mood") String mood,
            @RequestParam(defaultValue = "true") boolean isPublic,
            @RequestParam("audio") MultipartFile audio,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {

        if (!"audio/mpeg".equals(audio.getContentType()) &&
                !audio.getOriginalFilename().toLowerCase().endsWith(".mp3")) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_FORMAT);
        }
        if (audio.getSize() > 50 * 1024 * 1024) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        }

        SongResponse resp = songService.upload(title, artist, style, mood, isPublic, audio.getBytes(), principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("上传成功", resp));
    }

    @PostMapping("/{id}/cover")
    public ResponseEntity<ApiResponse<?>> uploadCover(
            @PathVariable Long id,
            @RequestParam("cover") MultipartFile cover,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {

        String contentType = cover.getContentType();
        Set<String> allowed = Set.of("image/jpeg", "image/png", "image/webp");
        if (contentType == null || !allowed.contains(contentType)) {
            throw new BusinessException(ErrorCode.COVER_FORMAT_INVALID);
        }
        String ext = contentType.replace("image/", "");
        if ("jpeg".equals(ext)) ext = "jpg";
        if ("svg+xml".equals(ext)) ext = "svg";

        String url = songService.uploadCover(id, cover.getBytes(), ext, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("封面上传成功", new CoverResponse(url)));
    }

    @GetMapping("/{id}/cover")
    public ResponseEntity<Resource> getCover(@PathVariable Long id) {
        String coverPath = songService.getCoverPath(id);
        if (coverPath == null) return ResponseEntity.notFound().build();
        Path path = Path.of(coverPath);
        if (!Files.exists(path)) return ResponseEntity.notFound().build();
        Resource resource = new FileSystemResource(path);
        try {
            String contentType = Files.probeContentType(path);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType != null ? contentType : "image/jpeg")
                    .contentLength(resource.contentLength())
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/video")
    public ResponseEntity<ApiResponse<?>> uploadVideo(
            @PathVariable Long id,
            @RequestParam("video") MultipartFile video,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {

        String contentType = video.getContentType();
        if (contentType == null || !"video/mp4".equals(contentType)) {
            if (!video.getOriginalFilename().toLowerCase().endsWith(".mp4")) {
                throw new BusinessException(ErrorCode.UNSUPPORTED_FORMAT);
            }
        }
        if (video.getSize() > 200 * 1024 * 1024) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        }

        String url = songService.uploadVideo(id, video.getBytes(), "mp4", principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("MV上传成功", new VideoResponse(url)));
    }

    @GetMapping("/{id}/video")
    public ResponseEntity<Resource> getVideo(@PathVariable Long id) {
        String videoPath = songService.getVideoPath(id);
        if (videoPath == null) return ResponseEntity.notFound().build();
        Path path = Path.of(videoPath);
        if (!Files.exists(path)) return ResponseEntity.notFound().build();
        Resource resource = new FileSystemResource(path);
        try {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "video/mp4")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentLength(resource.contentLength())
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SongResponse>> update(
            @PathVariable Long id,
            @RequestBody SongUpdateRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        songService.update(id, req, principal.getId(), "admin".equals(principal.getRole()));
        return ResponseEntity.ok(ApiResponse.ok("编辑成功", songService.getById(id, principal.getId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        songService.delete(id, principal.getId(), "admin".equals(principal.getRole()));
        return ResponseEntity.ok(ApiResponse.ok("删除成功", null));
    }

    record CoverResponse(String coverUrl) {}
    record VideoResponse(String videoUrl) {}
}
