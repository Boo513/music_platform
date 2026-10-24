package com.musicplatform.dto;

import lombok.Data;

@Data
public class AIRequestDto {

    private String prompt;

    private Integer user_id;
}
