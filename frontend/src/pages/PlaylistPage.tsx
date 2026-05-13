import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { playlistsApi } from '@/api/playlists';
import { usePlayerStore } from '@/stores/playerStore';
import { startAudioPlayback } from '@/hooks/useAudioPlayer';
import type { Song, Playlist } from '@/types';
import styles from './PlaylistPage.module.css';

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { play } = usePlayerStore();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [popupIdx, setPopupIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(0);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const refreshPlaylist = useCallback(() => {
    if (!id) return;
    playlistsApi.getById(Number(id)).then((res) => setPlaylist(res.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadError(false);
    playlistsApi
      .getById(Number(id))
      .then((res) => setPlaylist(res.data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const songs: Song[] = playlist?.songs ?? [];

  const handleRemoveClick = useCallback((e: React.MouseEvent, songId: number) => {
    e.stopPropagation();
    setConfirmRemoveId(songId);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (!id || confirmRemoveId === null) return;
    playlistsApi.removeSong(Number(id), confirmRemoveId).then(() => refreshPlaylist()).catch(() => {});
    setConfirmRemoveId(null);
  }, [id, confirmRemoveId, refreshPlaylist]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDeletePlaylist = useCallback(() => {
    if (!id) return;
    playlistsApi.delete(Number(id)).then(() => navigate('/profile')).catch(() => {});
  }, [id, navigate]);

  const handleCard = useCallback((song: Song) => {
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setPopupIdx((v) => v + 1);
    setAfterIdx((v) => v + 1);
    setSelectedId(song.id);

    // PLAY! 效果展示 1 秒后开始播放
    setTimeout(() => {
      play(song, songs);
      startAudioPlayback(song.id);
      navigate(`/play/${song.id}`);
    }, 1000);
  }, [songs, play, navigate]);

  const handlePlayAll = useCallback(() => {
    if (songs.length === 0) return;
    const first = songs[0];
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setPopupIdx((v) => v + 1);
    setAfterIdx((v) => v + 1);
    setSelectedId(first.id);

    setTimeout(() => {
      play(first, songs);
      startAudioPlayback(first.id);
      navigate(`/play/${first.id}`);
    }, 1000);
  }, [songs, play, navigate]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.stripes} />
        <button onClick={() => navigate('/profile')} style={{ position: 'fixed', top: 24, left: 24, zIndex: 100, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer' }}>←</button>
        <span style={{ color: '#fff', position: 'relative', zIndex: 1, margin: 'auto', fontSize: 14 }}>加载中...</span>
      </div>
    );
  }

  if (loadError || !playlist) {
    return (
      <div className={styles.page}>
        <div className={styles.stripes} />
        <button onClick={() => navigate('/profile')} style={{ position: 'fixed', top: 24, left: 24, zIndex: 100, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer' }}>←</button>
        <span style={{ color: '#ff0000', position: 'relative', zIndex: 1, margin: 'auto', fontSize: 14 }}>
          {loadError ? '加载失败' : '歌单不存在'}
        </span>
      </div>
    );
  }

  const styleEmoji = (s: Song) => {
    const map: Record<string, string> = {
      rock: '🔴', pop: '🟡', classical: '🎻', electronic: '⚡',
      folk: '🌿', jazz: '🎷', hiphop: '🎤', rnb: '💎',
    };
    return map[s.style] || '◆';
  };

  const moodLabel = (s: Song) => {
    const map: Record<string, string> = {
      happy: 'HAPPY', sad: 'SAD', calm: 'CALM', excited: '激昂', romantic: '浪漫', melancholy: '忧郁',
    };
    return map[s.mood] || s.mood.toUpperCase();
  };

  const styleLabel = (s: Song) => s.style.toUpperCase();

  return (
    <div className={styles.page}>
      <div className={styles.stripes} />

      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/profile')}
        style={{
          position: 'fixed', top: 24, left: 24, zIndex: 100,
          width: 40, height: 40, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
        }}
        title="返回个人中心"
      >
        ←
      </button>

      {/* 黑色闪屏 */}
      <AnimatePresence>
        {flash && (
          <motion.div
            className={styles.blackFlash}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.07 }}
          />
        )}
      </AnimatePresence>

      {/* PLAY! 弹窗 */}
      <AnimatePresence>
        {popupIdx > 0 && (
          <motion.div
            key={popupIdx}
            className={styles.playPopup}
            initial={{ opacity: 0, scale: 0.2, rotate: -25 }}
            animate={{ opacity: 1, scale: 1.15, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.5, rotate: 12 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            PLAY!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 左侧信息面板 ── */}
      <div className={styles.leftPanel}>
        <div className={styles.infoCard}>
          <div className={styles.infoName}>{playlist.name}</div>
          <div className={styles.infoDivider} />
          <div className={styles.infoDesc}>{playlist.description || '暂无描述'}</div>
          <div className={styles.infoMeta}>
            {playlist.songCount}首·{playlist.isPublic ? '公开' : '私密 🔒'}·@{playlist.owner.nickname}
          </div>
          <button className={styles.deleteListBtn} onClick={handleDeleteClick}>
            ╳ 删除歌单
          </button>
        </div>
      </div>

      {/* ── 右侧技能列表 ── */}
      <div className={styles.rightPanel}>
        <div className={styles.cardList}>
          {songs.length === 0 ? (
            <div style={{ color: '#ff0000', fontSize: 18, fontWeight: 900, letterSpacing: 4, padding: 40 }}>
              暂无歌曲
            </div>
          ) : (
            songs.map((song) => {
              const isActive = selectedId === song.id;
              return (
                <motion.div
                  key={song.id}
                  className={`${styles.cardWrap} ${isActive ? styles.selected : ''}`}
                  animate={{
                    z: isActive ? 50 : 0,
                    scale: isActive ? 1.04 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                >
                  {/* 闪电层 */}
                  <div className={styles.arcLayer} />

                  {/* 残影拖尾 */}
                  <AnimatePresence>
                    {afterIdx > 0 && isActive && (
                      <motion.div
                        key={afterIdx}
                        className={styles.afterimage}
                        initial={{ opacity: 0.65, x: 0, filter: 'blur(0px)' }}
                        animate={{ opacity: 0, x: 70, scaleX: 1.4, filter: 'blur(8px)' }}
                        transition={{ duration: 0.5 }}
                        onAnimationComplete={() => setAfterIdx(0)}
                      />
                    )}
                  </AnimatePresence>

                  {/* 卡牌本体 */}
                  <div className={styles.card} onClick={() => handleCard(song)}>
                    <div className={styles.cardInner}>
                      <div className={styles.cardIcon}>
                        {isActive ? '▶' : styleEmoji(song)}
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardName}>{song.title}</div>
                        <div className={styles.cardArtist}>{song.artist} · {song.playCount}次播放</div>
                        <div className={styles.cardTags}>
                          <span className={`${styles.tag} ${styles.tagRed}`}>
                            {styleLabel(song)}
                          </span>
                          <span className={`${styles.tag} ${styles.tagCyan}`}>
                            {moodLabel(song)}
                          </span>
                        </div>
                      </div>
                      <button
                        className={styles.removeBtn}
                        onClick={(e) => handleRemoveClick(e, song.id)}
                        title="移除此歌曲"
                      >
                        ╳
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* 底部居中按钮 */}
      {songs.length > 0 && (
        <button className={styles.bottomBtn} onClick={handlePlayAll}>
          ▶ 播放全部
        </button>
      )}

      {/* 确认移除歌曲弹窗 */}
      {confirmRemoveId !== null && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmRemoveId(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmTitle}>确定要移除这首歌吗？</div>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setConfirmRemoveId(null)}>取消</button>
              <button className={styles.confirmOk} onClick={handleConfirmRemove}>移除</button>
            </div>
          </div>
        </div>
      )}

      {/* 确认删除歌单弹窗 */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmTitle}>确定要删除整个歌单吗？<br /><span style={{fontSize:11,color:'#888'}}>此操作不可撤销</span></div>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowDeleteConfirm(false)}>取消</button>
              <button className={styles.confirmOk} onClick={handleConfirmDeletePlaylist}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
