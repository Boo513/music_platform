package com.musicplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SongUploadRequest {
    @NotBlank(message = "歌曲标题不能为空")
    @Size(min = 1, max = 200, message = "标题长度1-200字符")
    private String title;

    @NotBlank(message = "艺术家不能为空")
    @Size(min = 1, max = 200, message = "艺术家名称长度1-200字符")
    private String artist;

    @NotBlank(message = "风格不能为空")
    private String style;

    @NotBlank(message = "情绪不能为空")
    private String mood;
}
