package com.musicplatform.mapper;

import com.musicplatform.entity.Playlist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PlaylistMapper {
    Playlist selectById(@Param("id") Long id);
    List<Playlist> selectByUserId(@Param("userId") Long userId);
    int insert(Playlist playlist);
    int update(Playlist playlist);
    int deleteById(@Param("id") Long id);
    int countSongs(@Param("playlistId") Long playlistId);
}
