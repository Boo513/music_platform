package com.musicplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PlaylistCreateRequest {
    @NotBlank(message = "歌单名不能为空")
    @Size(min = 1, max = 200, message = "歌单名长度1-200字符")
    private String name;

    @Size(max = 500, message = "描述最长500字符")
    private String description;

    private Boolean isPublic;
}
