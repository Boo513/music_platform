package com.musicplatform.mapper;

import com.musicplatform.entity.Song;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SongMapper {
    Song selectById(@Param("id") Long id);
    List<Song> selectAll(
        @Param("style") String style,
        @Param("mood") String mood,
        @Param("keyword") String keyword,
        @Param("sort") String sort,
        @Param("offset") int offset,
        @Param("size") int size
    );
    int countAll(
        @Param("style") String style,
        @Param("mood") String mood,
        @Param("keyword") String keyword
    );
    int insert(Song song);
    int deleteById(@Param("id") Long id);
    int incrementPlayCount(@Param("id") Long id);
    int updateCoverPath(@Param("id") Long id, @Param("coverPath") String coverPath);
    int updateVideoPath(@Param("id") Long id, @Param("videoPath") String videoPath);
}
