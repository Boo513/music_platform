package com.musicplatform.service;

import com.musicplatform.dto.*;
import com.musicplatform.entity.User;
import com.musicplatform.exception.BusinessException;
import com.musicplatform.exception.ErrorCode;
import com.musicplatform.mapper.UserMapper;
import com.musicplatform.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userMapper = userMapper;
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
        return UserInfo.from(user);
    }

    public LoginResponse login(LoginRequest req) {
        User user = userMapper.selectByUsername(req.getUsername());
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        String token = tokenProvider.generateToken(user.getId(), user.getUsername());
        return new LoginResponse(token, UserInfo.from(user));
    }
}
