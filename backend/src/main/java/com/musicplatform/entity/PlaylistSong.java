package com.musicplatform.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PlaylistSong {
    private Long id;
    private Long playlistId;
    private Long songId;
    private Integer sortOrder;
    private LocalDateTime addedAt;
}
