package com.musicplatform.service;

import com.musicplatform.dto.UserInfo;
import com.musicplatform.entity.User;
import com.musicplatform.mapper.UserMapper;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public User getById(Long id) {
        return userMapper.selectById(id);
    }

    public UserInfo getUserInfo(Long userId) {
        return UserInfo.from(userMapper.selectById(userId));
    }

    public void updateProfile(Long userId, String nickname) {
        User user = new User();
        user.setId(userId);
        user.setNickname(nickname);
        userMapper.update(user);
    }
}
