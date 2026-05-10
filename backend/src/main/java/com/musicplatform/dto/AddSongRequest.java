package com.musicplatform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddSongRequest {
    @NotNull(message = "歌曲ID不能为空")
    private Long songId;
}
