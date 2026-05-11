package com.musicplatform.mapper;

import com.musicplatform.entity.Song;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PlaylistSongMapper {
    List<Song> selectSongsByPlaylistId(@Param("playlistId") Long playlistId);
    int insert(@Param("playlistId") Long playlistId, @Param("songId") Long songId,
               @Param("sortOrder") int sortOrder);
    int deleteByPlaylistAndSong(@Param("playlistId") Long playlistId, @Param("songId") Long songId);
    int deleteByPlaylistId(@Param("playlistId") Long playlistId);
    int deleteBySongId(@Param("songId") Long songId);
    boolean existsByPlaylistAndSong(@Param("playlistId") Long playlistId, @Param("songId") Long songId);
    int maxSortOrder(@Param("playlistId") Long playlistId);
}
