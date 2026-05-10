package com.musicplatform.mapper;

import com.musicplatform.entity.Song;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FavoriteMapper {
    int insert(@Param("userId") Long userId, @Param("songId") Long songId);
    int delete(@Param("userId") Long userId, @Param("songId") Long songId);
    boolean exists(@Param("userId") Long userId, @Param("songId") Long songId);
    List<Song> selectByUserId(
        @Param("userId") Long userId,
        @Param("offset") int offset,
        @Param("size") int size
    );
    int countByUserId(@Param("userId") Long userId);
    int deleteBySongId(@Param("songId") Long songId);
    int countBySongId(@Param("songId") Long songId);
}
