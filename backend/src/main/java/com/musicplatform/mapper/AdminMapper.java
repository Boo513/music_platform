package com.musicplatform.mapper;

import com.musicplatform.entity.Admin;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AdminMapper {
    Admin selectByUsername(@Param("username") String username);
}
