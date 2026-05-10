package com.musicplatform.dto;

import com.musicplatform.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserInfo {
    private Long id;
    private String username;
    private String nickname;
    private String avatar;
    private LocalDateTime createdAt;

    public static UserInfo from(User user) {
        UserInfo info = new UserInfo();
        info.setId(user.getId());
        info.setUsername(user.getUsername());
        info.setNickname(user.getNickname());
        info.setAvatar(user.getAvatar());
        info.setCreatedAt(user.getCreatedAt());
        return info;
    }
}
