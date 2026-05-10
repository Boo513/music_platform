package com.musicplatform.mapper;

import com.musicplatform.entity.PlayHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HistoryMapper {
    int insert(@Param("userId") Long userId, @Param("songId") Long songId);
    List<PlayHistory> selectByUserId(
        @Param("userId") Long userId,
        @Param("offset") int offset,
        @Param("size") int size
    );
    int countByUserId(@Param("userId") Long userId);
    int deleteBySongId(@Param("songId") Long songId);
}
