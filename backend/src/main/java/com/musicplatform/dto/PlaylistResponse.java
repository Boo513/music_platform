package com.musicplatform.dto;

import com.musicplatform.entity.Playlist;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PlaylistResponse {
    private Long id;
    private String name;
    private String description;
    private String cover;
    private Boolean isPublic;
    private Integer songCount;
    private OwnerInfo owner;
    private List<SongResponse> songs;
    private LocalDateTime createdAt;

    @Data
    public static class OwnerInfo {
        private Long id;
        private String nickname;
    }

    public static PlaylistResponse from(Playlist pl, int songCount) {
        PlaylistResponse r = new PlaylistResponse();
        r.setId(pl.getId());
        r.setName(pl.getName());
        r.setDescription(pl.getDescription());
        r.setCover(pl.getCover());
        r.setIsPublic(pl.getIsPublic());
        r.setSongCount(songCount);
        r.setCreatedAt(pl.getCreatedAt());
        return r;
    }
}
