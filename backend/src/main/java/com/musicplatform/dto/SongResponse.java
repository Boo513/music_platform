package com.musicplatform.dto;

import com.musicplatform.entity.Song;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SongResponse {
    private Long id;
    private String title;
    private String artist;
    private String coverUrl;
    private Integer duration;
    private String style;
    private String mood;
    private Integer playCount;
    private Boolean isFavorited;
    private Boolean hasVideo;
    private UploaderInfo uploader;
    private LocalDateTime createdAt;

    @Data
    public static class UploaderInfo {
        private Long id;
        private String nickname;
    }

    public static SongResponse from(Song song, Boolean isFavorited) {
        SongResponse r = new SongResponse();
        r.setId(song.getId());
        r.setTitle(song.getTitle());
        r.setArtist(song.getArtist());
        r.setCoverUrl(song.getCoverPath() != null ? "/api/songs/" + song.getId() + "/cover" : null);
        r.setDuration(song.getDuration());
        r.setStyle(song.getStyle());
        r.setMood(song.getMood());
        r.setPlayCount(song.getPlayCount() != null ? song.getPlayCount() : 0);
        r.setIsFavorited(isFavorited);
        r.setHasVideo(song.getVideoPath() != null && !song.getVideoPath().isEmpty());
        r.setCreatedAt(song.getCreatedAt());
        return r;
    }
}
