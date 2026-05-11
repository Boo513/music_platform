CREATE DATABASE IF NOT EXISTS music_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE music_platform;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL COMMENT 'BCrypt加密',
    nickname    VARCHAR(100),
    avatar      VARCHAR(500) COMMENT '头像URL',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 歌曲表
CREATE TABLE IF NOT EXISTS songs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    artist      VARCHAR(200) NOT NULL DEFAULT '未知艺术家',
    file_path   VARCHAR(500) NOT NULL COMMENT 'MP3文件路径（相对于uploads/audio/）',
    cover_path  VARCHAR(500) COMMENT '封面图路径',
    video_path  VARCHAR(500) COMMENT 'MV视频路径',
    duration    INT NOT NULL DEFAULT 0 COMMENT '时长（秒）',
    style       VARCHAR(20) NOT NULL COMMENT '风格',
    mood        VARCHAR(20) NOT NULL COMMENT '情绪',
    uploader_id BIGINT NOT NULL,
    play_count  INT NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id),
    INDEX idx_style (style),
    INDEX idx_mood (mood),
    INDEX idx_style_mood (style, mood),
    INDEX idx_play_count (play_count DESC)
) ENGINE=InnoDB;

-- 歌单表
CREATE TABLE IF NOT EXISTS playlists (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    cover       VARCHAR(500),
    user_id     BIGINT NOT NULL,
    is_public   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 歌单-歌曲关联表
CREATE TABLE IF NOT EXISTS playlist_songs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    playlist_id BIGINT NOT NULL,
    song_id     BIGINT NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    UNIQUE KEY uk_playlist_song (playlist_id, song_id)
) ENGINE=InnoDB;

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    song_id     BIGINT NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (song_id) REFERENCES songs(id),
    UNIQUE KEY uk_user_song (user_id, song_id)
) ENGINE=InnoDB;

-- 播放历史表
CREATE TABLE IF NOT EXISTS play_history (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    song_id     BIGINT NOT NULL,
    played_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (song_id) REFERENCES songs(id),
    INDEX idx_user_played (user_id, played_at DESC)
) ENGINE=InnoDB;
