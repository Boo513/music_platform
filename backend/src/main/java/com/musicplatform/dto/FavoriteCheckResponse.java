package com.musicplatform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FavoriteCheckResponse {
    private boolean favorited;
}
