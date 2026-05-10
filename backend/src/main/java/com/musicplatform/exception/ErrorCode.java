package com.musicplatform.exception;

public enum ErrorCode {
    USERNAME_EXISTS(409, "用户名已被注册"),
    INVALID_CREDENTIALS(400, "用户名或密码错误"),
    TOKEN_EXPIRED(401, "Token已过期，请重新登录"),
    TOKEN_INVALID(401, "Token格式错误"),
    SONG_NOT_FOUND(404, "歌曲不存在"),
    FILE_NOT_FOUND(404, "音频文件不存在"),
    INVALID_STYLE(400, "风格值非法"),
    INVALID_MOOD(400, "情绪值非法"),
    FILE_TOO_LARGE(400, "文件大小不能超过50MB"),
    UNSUPPORTED_FORMAT(400, "仅支持 MP3 格式"),
    FAVORITE_EXISTS(409, "已收藏过该歌曲"),
    FAVORITE_NOT_FOUND(404, "未收藏该歌曲"),
    PLAYLIST_NOT_FOUND(404, "歌单不存在"),
    SONG_ALREADY_IN_PLAYLIST(409, "歌曲已在歌单中"),
    FORBIDDEN(403, "无权操作此资源"),
    COVER_FORMAT_INVALID(400, "仅支持 JPG、PNG、WebP 格式");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
}
