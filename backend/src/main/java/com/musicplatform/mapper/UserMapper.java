package com.musicplatform.mapper;

import com.musicplatform.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {
    User selectById(@Param("id") Long id);
    User selectByUsername(@Param("username") String username);
    int insert(User user);
    int update(User user);
    boolean existsByUsername(@Param("username") String username);
}
