package com.musicplatform.dto;

import lombok.Data;

@Data
public class SongUpdateRequest {
    private String title;
    private String artist;
    private String style;
    private String mood;
}
