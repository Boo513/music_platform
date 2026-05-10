package com.musicplatform.service;

import com.musicplatform.dto.PageData;
import com.musicplatform.dto.PlayHistoryResponse;
import com.musicplatform.dto.SongResponse;
import com.musicplatform.entity.PlayHistory;
import com.musicplatform.exception.BusinessException;
import com.musicplatform.exception.ErrorCode;
import com.musicplatform.mapper.FavoriteMapper;
import com.musicplatform.mapper.HistoryMapper;
import com.musicplatform.mapper.SongMapper;
import com.musicplatform.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HistoryService {

    private final HistoryMapper historyMapper;
    private final SongMapper songMapper;
    private final FavoriteMapper favoriteMapper;
    private final UserMapper userMapper;

    public HistoryService(HistoryMapper historyMapper, SongMapper songMapper, FavoriteMapper favoriteMapper, UserMapper userMapper) {
        this.historyMapper = historyMapper;
        this.songMapper = songMapper;
        this.favoriteMapper = favoriteMapper;
        this.userMapper = userMapper;
    }

    @Transactional
    public void record(Long userId, Long songId) {
        if (songMapper.selectById(songId) == null) throw new BusinessException(ErrorCode.SONG_NOT_FOUND);
        historyMapper.insert(userId, songId);
        songMapper.incrementPlayCount(songId);
    }

    public PageData<PlayHistoryResponse> list(Long userId, int page, int size) {
        int offset = (page - 1) * size;
        List<PlayHistory> histories = historyMapper.selectByUserId(userId, offset, size);
        int total = historyMapper.countByUserId(userId);

        List<PlayHistoryResponse> records = histories.stream().map(h -> {
            var song = songMapper.selectById(h.getSongId());
            boolean fav = favoriteMapper.exists(userId, h.getSongId());
            SongResponse sr = song != null ? SongResponse.from(song, fav) : null;
            if (sr != null && song != null) {
                SongResponse.UploaderInfo ui = new SongResponse.UploaderInfo();
                ui.setId(song.getUploaderId());
                var uploader = userMapper.selectById(song.getUploaderId());
                if (uploader != null) ui.setNickname(uploader.getNickname());
                sr.setUploader(ui);
            }
            return PlayHistoryResponse.from(h, sr);
        }).toList();

        int pages = (int) Math.ceil((double) total / size);
        return new PageData<>(records, total, page, size, pages);
    }
}
