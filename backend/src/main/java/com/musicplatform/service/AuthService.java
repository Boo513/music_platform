package com.musicplatform.service;

import com.musicplatform.dto.*;
import com.musicplatform.entity.Admin;
import com.musicplatform.entity.User;
import com.musicplatform.exception.BusinessException;
import com.musicplatform.exception.ErrorCode;
import com.musicplatform.mapper.AdminMapper;
import com.musicplatform.mapper.UserMapper;
import com.musicplatform.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final AdminMapper adminMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserMapper userMapper, AdminMapper adminMapper,
                       PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userMapper = userMapper;
        this.adminMapper = adminMapper;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public UserInfo register(RegisterRequest req) {
        if (userMapper.existsByUsername(req.getUsername())) {
            throw new BusinessException(ErrorCode.USERNAME_EXISTS);
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setNickname(req.getNickname() != null && !req.getNickname().isBlank()
                ? req.getNickname() : req.getUsername());
        userMapper.insert(user);
        UserInfo info = UserInfo.from(user);
        info.setRole("user");
        return info;
    }

    public LoginResponse login(LoginRequest req) {
        // 先查用户表
        User user = userMapper.selectByUsername(req.getUsername());
        if (user != null && passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            String token = tokenProvider.generateToken(user.getId(), user.getUsername(), "user");
            UserInfo info = UserInfo.from(user);
            info.setRole("user");
            return new LoginResponse(token, info);
        }

        // 再查管理员表
        Admin admin = adminMapper.selectByUsername(req.getUsername());
        if (admin != null && passwordEncoder.matches(req.getPassword(), admin.getPassword())) {
            String token = tokenProvider.generateToken(admin.getId(), admin.getUsername(), "admin");
            UserInfo info = new UserInfo();
            info.setId(admin.getId());
            info.setUsername(admin.getUsername());
            info.setNickname(admin.getNickname());
            info.setRole("admin");
            return new LoginResponse(token, info);
        }

        throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
    }
}
