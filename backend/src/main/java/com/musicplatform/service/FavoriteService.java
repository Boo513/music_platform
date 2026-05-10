package com.musicplatform.service;

import com.musicplatform.dto.PageData;
import com.musicplatform.dto.SongResponse;
import com.musicplatform.entity.Song;
import com.musicplatform.exception.BusinessException;
import com.musicplatform.exception.ErrorCode;
import com.musicplatform.mapper.FavoriteMapper;
import com.musicplatform.mapper.SongMapper;
import com.musicplatform.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteMapper favoriteMapper;
    private final SongMapper songMapper;
    private final UserMapper userMapper;

    public FavoriteService(FavoriteMapper favoriteMapper, SongMapper songMapper, UserMapper userMapper) {
        this.favoriteMapper = favoriteMapper;
        this.songMapper = songMapper;
        this.userMapper = userMapper;
    }

    @Transactional
    public void add(Long userId, Long songId) {
        if (songMapper.selectById(songId) == null) throw new BusinessException(ErrorCode.SONG_NOT_FOUND);
        if (favoriteMapper.exists(userId, songId)) throw new BusinessException(ErrorCode.FAVORITE_EXISTS);
        favoriteMapper.insert(userId, songId);
    }

    @Transactional
    public void remove(Long userId, Long songId) {
        if (!favoriteMapper.exists(userId, songId)) throw new BusinessException(ErrorCode.FAVORITE_NOT_FOUND);
        favoriteMapper.delete(userId, songId);
    }

    public PageData<SongResponse> list(Long userId, int page, int size) {
        int offset = (page - 1) * size;
        List<Song> songs = favoriteMapper.selectByUserId(userId, offset, size);
        int total = favoriteMapper.countByUserId(userId);

        List<SongResponse> records = songs.stream().map(s -> {
            SongResponse r = SongResponse.from(s, true);
            SongResponse.UploaderInfo ui = new SongResponse.UploaderInfo();
            ui.setId(s.getUploaderId());
            var uploader = userMapper.selectById(s.getUploaderId());
            if (uploader != null) ui.setNickname(uploader.getNickname());
            r.setUploader(ui);
            return r;
        }).toList();

        int pages = (int) Math.ceil((double) total / size);
        return new PageData<>(records, total, page, size, pages);
    }

    public boolean isFavorited(Long userId, Long songId) {
        return favoriteMapper.exists(userId, songId);
    }
}
