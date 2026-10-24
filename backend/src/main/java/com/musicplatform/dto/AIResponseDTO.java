package com.musicplatform.dto;

import lombok.Data;

@Data
public class AIResponseDTO {
    private String type;      // 比如 "recommendation"
    private String content;   // 模型回答内容
    private Long userId;      // 用户ID
}