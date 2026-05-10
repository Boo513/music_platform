package com.musicplatform.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Favorite {
    private Long id;
    private Long userId;
    private Long songId;
    private LocalDateTime createdAt;
}
