package com.musicplatform.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Admin {
    private Long id;
    private String username;
    private String password;
    private String nickname;
    private LocalDateTime createdAt;
}
