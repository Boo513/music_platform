package com.musicplatform.service;

import com.musicplatform.dto.PlaylistResponse;
import com.musicplatform.dto.SongResponse;
import com.musicplatform.entity.Playlist;
import com.musicplatform.entity.Song;
import com.musicplatform.exception.BusinessException;
import com.musicplatform.exception.ErrorCode;
import com.musicplatform.mapper.FavoriteMapper;
import com.musicplatform.mapper.PlaylistMapper;
import com.musicplatform.mapper.PlaylistSongMapper;
import com.musicplatform.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlaylistService {

    private final PlaylistMapper playlistMapper;
    private final PlaylistSongMapper playlistSongMapper;
    private final FavoriteMapper favoriteMapper;
    private final UserMapper userMapper;

    public PlaylistService(PlaylistMapper playlistMapper, PlaylistSongMapper playlistSongMapper,
                           FavoriteMapper favoriteMapper, UserMapper userMapper) {
        this.playlistMapper = playlistMapper;
        this.playlistSongMapper = playlistSongMapper;
        this.favoriteMapper = favoriteMapper;
        this.userMapper = userMapper;
    }

    @Transactional
    public PlaylistResponse create(String name, String description, Boolean isPublic, Long userId) {
        Playlist pl = new Playlist();
        pl.setName(name);
        pl.setDescription(description);
        pl.setIsPublic(isPublic != null ? isPublic : true);
        pl.setUserId(userId);
        playlistMapper.insert(pl);

        PlaylistResponse r = PlaylistResponse.from(pl, 0);
        PlaylistResponse.OwnerInfo oi = new PlaylistResponse.OwnerInfo();
        oi.setId(userId);
        var user = userMapper.selectById(userId);
        oi.setNickname(user != null ? user.getNickname() : "");
        r.setOwner(oi);
        return r;
    }

    public List<PlaylistResponse> listByUser(Long userId) {
        List<Playlist> playlists = playlistMapper.selectByUserId(userId);
        return playlists.stream().map(pl -> {
            int cnt = playlistMapper.countSongs(pl.getId());
            PlaylistResponse r = PlaylistResponse.from(pl, cnt);
            PlaylistResponse.OwnerInfo oi = new PlaylistResponse.OwnerInfo();
            oi.setId(userId);
            var user = userMapper.selectById(userId);
            oi.setNickname(user != null ? user.getNickname() : "");
            r.setOwner(oi);
            return r;
        }).toList();
    }

    public PlaylistResponse getById(Long id, Long userId) {
        Playlist pl = playlistMapper.selectById(id);
        if (pl == null) throw new BusinessException(ErrorCode.PLAYLIST_NOT_FOUND);
        if (!pl.getIsPublic() && !pl.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        List<Song> songs = playlistSongMapper.selectSongsByPlaylistId(id);
        List<SongResponse> songResps = songs.stream().map(s -> {
            boolean fav = userId != null && favoriteMapper.exists(userId, s.getId());
            SongResponse sr = SongResponse.from(s, fav);
            SongResponse.UploaderInfo ui = new SongResponse.UploaderInfo();
            ui.setId(s.getUploaderId());
            var uploader = userMapper.selectById(s.getUploaderId());
            if (uploader != null) ui.setNickname(uploader.getNickname());
            sr.setUploader(ui);
            return sr;
        }).toList();

        PlaylistResponse r = PlaylistResponse.from(pl, songs.size());
        PlaylistResponse.OwnerInfo oi = new PlaylistResponse.OwnerInfo();
        var owner = userMapper.selectById(pl.getUserId());
        oi.setId(pl.getUserId());
        oi.setNickname(owner != null ? owner.getNickname() : "");
        r.setOwner(oi);
        r.setSongs(songResps);
        return r;
    }

    @Transactional
    public PlaylistResponse update(Long id, String name, String description, Boolean isPublic, Long userId) {
        Playlist pl = playlistMapper.selectById(id);
        if (pl == null) throw new BusinessException(ErrorCode.PLAYLIST_NOT_FOUND);
        if (!pl.getUserId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);

        pl.setName(name != null ? name : pl.getName());
        pl.setDescription(description != null ? description : pl.getDescription());
        pl.setIsPublic(isPublic != null ? isPublic : pl.getIsPublic());
        playlistMapper.update(pl);

        Playlist updated = playlistMapper.selectById(id);
        return PlaylistResponse.from(updated, playlistMapper.countSongs(id));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Playlist pl = playlistMapper.selectById(id);
        if (pl == null) throw new BusinessException(ErrorCode.PLAYLIST_NOT_FOUND);
        if (!pl.getUserId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        playlistSongMapper.deleteByPlaylistId(id);
        playlistMapper.deleteById(id);
    }

    @Transactional
    public void addSong(Long playlistId, Long songId, Long userId) {
        Playlist pl = playlistMapper.selectById(playlistId);
        if (pl == null) throw new BusinessException(ErrorCode.PLAYLIST_NOT_FOUND);
        if (!pl.getUserId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        if (playlistSongMapper.existsByPlaylistAndSong(playlistId, songId)) {
            throw new BusinessException(ErrorCode.SONG_ALREADY_IN_PLAYLIST);
        }
        int nextOrder = playlistSongMapper.maxSortOrder(playlistId) + 1;
        playlistSongMapper.insert(playlistId, songId, nextOrder);
    }

    @Transactional
    public void removeSong(Long playlistId, Long songId, Long userId) {
        Playlist pl = playlistMapper.selectById(playlistId);
        if (pl == null) throw new BusinessException(ErrorCode.PLAYLIST_NOT_FOUND);
        if (!pl.getUserId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        playlistSongMapper.deleteByPlaylistAndSong(playlistId, songId);
    }
}
