package com.musicplatform.dto;

import com.musicplatform.entity.PlayHistory;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PlayHistoryResponse {
    private Long id;
    private SongResponse song;
    private LocalDateTime playedAt;

    public static PlayHistoryResponse from(PlayHistory h, SongResponse song) {
        PlayHistoryResponse r = new PlayHistoryResponse();
        r.setId(h.getId());
        r.setSong(song);
        r.setPlayedAt(h.getPlayedAt());
        return r;
    }
}
