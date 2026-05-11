package com.musicplatform.service;

import com.musicplatform.dto.PageData;
import com.musicplatform.dto.SongResponse;
import com.musicplatform.dto.SongUpdateRequest;
import com.musicplatform.entity.Song;
import com.musicplatform.exception.BusinessException;
import com.musicplatform.exception.ErrorCode;
import com.musicplatform.mapper.FavoriteMapper;
import com.musicplatform.mapper.HistoryMapper;
import com.musicplatform.mapper.PlaylistSongMapper;
import com.musicplatform.mapper.SongMapper;
import com.musicplatform.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;

@Service
public class SongService {

    private final SongMapper songMapper;
    private final FavoriteMapper favoriteMapper;
    private final HistoryMapper historyMapper;
    private final PlaylistSongMapper playlistSongMapper;
    private final UserMapper userMapper;

    @Value("${app.upload.audio-dir:uploads/audio}")
    private String audioDir;

    @Value("${app.upload.cover-dir:uploads/covers}")
    private String coverDir;

    @Value("${app.upload.video-dir:uploads/videos}")
    private String videoDir;

    public SongService(SongMapper songMapper, FavoriteMapper favoriteMapper,
                       HistoryMapper historyMapper, PlaylistSongMapper playlistSongMapper,
                       UserMapper userMapper) {
        this.songMapper = songMapper;
        this.favoriteMapper = favoriteMapper;
        this.historyMapper = historyMapper;
        this.playlistSongMapper = playlistSongMapper;
        this.userMapper = userMapper;
    }

    private SongResponse.UploaderInfo buildUploader(Long uploaderId) {
        SongResponse.UploaderInfo ui = new SongResponse.UploaderInfo();
        ui.setId(uploaderId);
        var user = userMapper.selectById(uploaderId);
        if (user != null) ui.setNickname(user.getNickname());
        return ui;
    }

    private static final Set<String> VALID_STYLES = Set.of(
            "rock", "pop", "classical", "electronic", "folk", "jazz", "hiphop", "rnb");
    private static final Set<String> VALID_MOODS = Set.of(
            "happy", "sad", "calm", "excited", "romantic", "melancholy");

    public PageData<SongResponse> list(String style, String mood, String keyword,
                                        String sort, int page, int size, Long userId, boolean isAdmin) {
        if (style != null && !VALID_STYLES.contains(style)) {
            throw new BusinessException(ErrorCode.INVALID_STYLE);
        }
        if (mood != null && !VALID_MOODS.contains(mood)) {
            throw new BusinessException(ErrorCode.INVALID_MOOD);
        }
        int offset = (page - 1) * size;
        List<Song> songs = songMapper.selectAll(style, mood, keyword, sort, offset, size, userId, isAdmin);
        int total = songMapper.countAll(style, mood, keyword, userId, isAdmin);

        List<SongResponse> records = songs.stream().map(s -> {
            boolean fav = userId != null && favoriteMapper.exists(userId, s.getId());
            SongResponse r = SongResponse.from(s, fav);
            r.setUploader(buildUploader(s.getUploaderId()));
            return r;
        }).toList();

        int pages = (int) Math.ceil((double) total / size);
        return new PageData<>(records, total, page, size, pages);
    }

    public SongResponse getById(Long id, Long userId) {
        Song song = songMapper.selectById(id);
        if (song == null) throw new BusinessException(ErrorCode.SONG_NOT_FOUND);
        boolean fav = userId != null && favoriteMapper.exists(userId, song.getId());
        SongResponse r = SongResponse.from(song, fav);
        r.setUploader(buildUploader(song.getUploaderId()));
        return r;
    }

    public String getCoverPath(Long id) {
        Song song = songMapper.selectById(id);
        if (song == null || song.getCoverPath() == null) return null;
        Path filePath = Paths.get(coverDir, song.getCoverPath());
        if (!Files.exists(filePath)) return null;
        return filePath.toAbsolutePath().toString();
    }

    public String getStreamPath(Long id) {
        Song song = songMapper.selectById(id);
        if (song == null) throw new BusinessException(ErrorCode.SONG_NOT_FOUND);
        Path filePath = Paths.get(audioDir, song.getFilePath());
        if (!Files.exists(filePath)) throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        return filePath.toAbsolutePath().toString();
    }

    @Transactional
    public SongResponse upload(String title, String artist, String style, String mood,
                                Boolean isPublic, byte[] fileBytes, Long uploaderId) {
        if (!VALID_STYLES.contains(style)) throw new BusinessException(ErrorCode.INVALID_STYLE);
        if (!VALID_MOODS.contains(mood)) throw new BusinessException(ErrorCode.INVALID_MOOD);

        try {
            Path audioPath = Paths.get(audioDir);
            Files.createDirectories(audioPath);
            String fileName = java.util.UUID.randomUUID() + ".mp3";
            Files.write(audioPath.resolve(fileName), fileBytes);

            Song song = new Song();
            song.setTitle(title.trim());
            song.setArtist(artist.trim());
            song.setFilePath(fileName);
            song.setStyle(style);
            song.setMood(mood);
            song.setIsPublic(isPublic);
            song.setUploaderId(uploaderId);
            song.setDuration(0);
            songMapper.insert(song);

            SongResponse r = SongResponse.from(song, false);
            r.setUploader(buildUploader(uploaderId));
            return r;
        } catch (IOException e) {
            throw new RuntimeException("文件写入失败", e);
        }
    }

    @Transactional
    public void update(Long id, SongUpdateRequest req, Long userId, boolean isAdmin) {
        Song song = songMapper.selectById(id);
        if (song == null) throw new BusinessException(ErrorCode.SONG_NOT_FOUND);
        if (!isAdmin && !song.getUploaderId().equals(userId))
            throw new BusinessException(ErrorCode.FORBIDDEN);

        if (req.getTitle() != null && !req.getTitle().isBlank())
            song.setTitle(req.getTitle().trim());
        if (req.getArtist() != null && !req.getArtist().isBlank())
            song.setArtist(req.getArtist().trim());
        if (req.getStyle() != null) {
            if (!VALID_STYLES.contains(req.getStyle()))
                throw new BusinessException(ErrorCode.INVALID_STYLE);
            song.setStyle(req.getStyle());
        }
        if (req.getMood() != null) {
            if (!VALID_MOODS.contains(req.getMood()))
                throw new BusinessException(ErrorCode.INVALID_MOOD);
            song.setMood(req.getMood());
        }
        songMapper.update(song);
    }

    @Transactional
    public void delete(Long id, Long userId, boolean isAdmin) {
        Song song = songMapper.selectById(id);
        if (song == null) throw new BusinessException(ErrorCode.SONG_NOT_FOUND);
        if (!isAdmin && !song.getUploaderId().equals(userId))
            throw new BusinessException(ErrorCode.FORBIDDEN);

        try {
            Path audioFile = Paths.get(audioDir, song.getFilePath());
            Files.deleteIfExists(audioFile);
            if (song.getCoverPath() != null) {
                Files.deleteIfExists(Paths.get(coverDir, song.getCoverPath()));
            }
            if (song.getVideoPath() != null) {
                Files.deleteIfExists(Paths.get(videoDir, song.getVideoPath()));
            }
        } catch (IOException ignored) {}

        // 删除所有关联数据（外键约束）
        favoriteMapper.deleteBySongId(song.getId());
        historyMapper.deleteBySongId(song.getId());
        playlistSongMapper.deleteBySongId(song.getId());
        songMapper.deleteById(id);
    }

    public String getVideoPath(Long id) {
        Song song = songMapper.selectById(id);
        if (song == null || song.getVideoPath() == null) return null;
        Path filePath = Paths.get(videoDir, song.getVideoPath());
        if (!Files.exists(filePath)) return null;
        return filePath.toAbsolutePath().toString();
    }

    @Transactional
    public String uploadVideo(Long songId, byte[] videoBytes, String extension, Long userId) {
        Song song = songMapper.selectById(songId);
        if (song == null) throw new BusinessException(ErrorCode.SONG_NOT_FOUND);
        if (!song.getUploaderId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);

        try {
            Path videoPath = Paths.get(videoDir);
            Files.createDirectories(videoPath);
            String fileName = java.util.UUID.randomUUID() + "." + extension;
            Files.write(videoPath.resolve(fileName), videoBytes);
            songMapper.updateVideoPath(songId, fileName);
            return "/api/songs/" + songId + "/video";
        } catch (IOException e) {
            throw new RuntimeException("视频上传失败", e);
        }
    }

    @Transactional
    public String uploadCover(Long songId, byte[] imageBytes, String extension, Long userId) {
        Song song = songMapper.selectById(songId);
        if (song == null) throw new BusinessException(ErrorCode.SONG_NOT_FOUND);
        if (!song.getUploaderId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);

        try {
            Path coverPath = Paths.get(coverDir);
            Files.createDirectories(coverPath);
            String fileName = java.util.UUID.randomUUID() + "." + extension;
            Files.write(coverPath.resolve(fileName), imageBytes);
            songMapper.updateCoverPath(songId, fileName);
            return "/uploads/covers/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("封面上传失败", e);
        }
    }
}
