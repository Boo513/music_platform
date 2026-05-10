package com.musicplatform.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Playlist {
    private Long id;
    private String name;
    private String description;
    private String cover;
    private Long userId;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
