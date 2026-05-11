package com.musicplatform.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Song {
    private Long id;
    private String title;
    private String artist;
    private String filePath;
    private String coverPath;
    private String videoPath;
    private Integer duration;
    private String style;
    private String mood;
    private Boolean isPublic;
    private Long uploaderId;
    private Integer playCount;
    private LocalDateTime createdAt;
}
