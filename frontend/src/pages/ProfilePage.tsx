import { useEffect, useRef, useState, useCallback, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { startAudioPlayback } from '@/hooks/useAudioPlayer';
import { authApi } from '@/api/auth';
import { playlistsApi } from '@/api/playlists';
import { songsApi } from '@/api/songs';
import { favoritesApi } from '@/api/favorites';
import { historyApi } from '@/api/history';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { CreatePlaylistModal } from '@/components/modals/CreatePlaylistModal';
import type { Song, Playlist, PlayHistoryItem } from '@/types';
import styles from './ProfilePage.module.css';

type TabKey = 'playlists' | 'uploads' | 'history' | 'favorites';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface Toast {
  id: number;
  text: string;
}

let rippleId = 0;
let toastId = 0;

const MENU_ITEMS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'playlists', label: '我的歌单', icon: '🎵' },
  { key: 'uploads', label: '上传歌曲', icon: '☁️' },
  { key: 'history', label: '播放历史', icon: '⏱️' },
  { key: 'favorites', label: '我的收藏', icon: '💎' },
];

const TAB_TITLES: Record<TabKey, string> = {
  playlists: '我的歌单',
  uploads: '上传歌曲',
  history: '播放历史',
  favorites: '我的收藏',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, fetchMe } = useAuthStore();
  const { play } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [uploads, setUploads] = useState<Song[]>([]);
  const [histories, setHistories] = useState<PlayHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { logout } = useAuthStore();

  // 3D card effects
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((text: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 1800);
  }, []);

  const addRipple = useCallback((e: MouseEvent<HTMLElement>, size = 120) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++rippleId;
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, size }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setRotateY(((e.clientX - cx) / rect.width) * 14);
    setRotateX(-((e.clientY - cy) / rect.height) * 14);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
  }, []);

  // 加载数据
  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!user) {
      fetchMe().finally(() => setPageLoading(false));
      return;
    }
    setPageLoading(false);
    playlistsApi.list().then((r) => setPlaylists(r.data)).catch(() => {});
    songsApi.list({ sort: 'newest' }).then((r) => {
      setUploads(r.data.records.filter((s) => s.uploader.id === user.id));
    }).catch(() => {});
    historyApi.list().then((r) => setHistories(r.data.records)).catch(() => {});
    favoritesApi.list().then((r) => setFavorites(r.data.records)).catch(() => {});
  }, [isLoggedIn, user, navigate]);

  const handleTabClick = (e: MouseEvent<HTMLDivElement>, key: TabKey) => {
    addRipple(e, 100);
    setActiveTab(key);
  };

  const handlePlay = (song: Song, list: Song[]) => {
    play(song, list);
    startAudioPlayback(song.id);
    navigate(`/play/${song.id}`);
  };

  if (pageLoading) {
    return (
      <div className={styles.page}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>加载中...</span>
      </div>
    );
  }

  const cardTransform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  return (
    <div className={styles.page}>
      {/* 背景光晕 */}
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
      <div className={styles.bgGlow3} />

      {/* 返回首页 */}
      <motion.button
        className={styles.backHomeBtn}
        onClick={() => navigate('/')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className={styles.backHomeIcon}>◂</span>
        <span>首页</span>
      </motion.button>

      {/* 3D 透视卡片 */}
      <div className={styles.cardWrap}>
        <motion.div
          ref={cardRef}
          className={styles.card}
          style={{ transform: cardTransform }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          animate={{
            boxShadow: `0 ${Math.abs(rotateX) + 8}px ${40 + Math.abs(rotateX) * 2}px rgba(188,19,254,${0.08 + Math.abs(rotateX) * 0.008})`,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        >
          {/* 头像区 */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarRing} />
              <div className={styles.avatarInner}>{user?.nickname?.charAt(0) || '1'}</div>
            </div>
            <div>
              <div className={styles.userName}>{user?.nickname || '1111'}</div>
              <div className={styles.userId}>@{user?.username || 'admin'}</div>
            </div>
            <button
              className={styles.editBtn}
              onClick={(e) => {
                addRipple(e, 80);
                setShowEditProfile(true);
              }}
            >
              编辑资料
            </button>
            <button
              className={styles.logoutBtn}
              onClick={(e) => {
                addRipple(e, 80);
                setShowLogoutConfirm(true);
              }}
            >
              退出
            </button>
          </div>

          {/* 统计 */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{uploads.length}</span>
              <span className={styles.statLabel}>上传</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{favorites.length}</span>
              <span className={styles.statLabel}>收藏</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{playlists.length}</span>
              <span className={styles.statLabel}>歌单</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === null ? (
              /* ── 主视图：2x2 菜单 + 底部 ── */
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className={styles.menuGrid}>
                  {MENU_ITEMS.map((item) => (
                    <motion.div
                      key={item.key}
                      className={styles.menuItem}
                      onClick={(e) => handleTabClick(e, item.key)}
                      whileHover={{ scale: 1.04, z: 20 }}
                      whileTap={{ scale: 0.96 }}
                      style={{ position: 'relative', overflow: 'hidden' }}
                    >
                      <div className={styles.menuIcon}>{item.icon}</div>
                      <span className={styles.menuLabel}>{item.label}</span>
                    </motion.div>
                  ))}
                </div>

                <div className={styles.bottom}>
                  <div className={styles.hint}>暂无歌单，点击 + 创建</div>
                  <motion.button
                    className={styles.createBtn}
                    onClick={(e) => {
                      addRipple(e, 160);
                      setShowCreatePlaylist(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    ＋ 新建歌单
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              /* ── 列表视图 ── */
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  className={styles.backBtn}
                  onClick={() => setActiveTab(null)}
                >
                  ← 返回
                </button>
                <div className={styles.listTitle}>{TAB_TITLES[activeTab]}</div>

                <div className={styles.listWrap}>
                  {activeTab === 'playlists' && (
                    playlists.length === 0 ? (
                      <div className={styles.empty}>暂无歌单</div>
                    ) : (
                      playlists.map((pl) => (
                        <div
                          key={pl.id}
                          className={styles.listItem}
                          onClick={() => navigate(`/playlist/${pl.id}`)}
                        >
                          <span className={styles.listIcon}>📋</span>
                          <div className={styles.listInfo}>
                            <div className={styles.listName}>{pl.name}</div>
                            <div className={styles.listMeta}>{pl.songCount} 首</div>
                          </div>
                          <span className={styles.listArrow}>›</span>
                        </div>
                      ))
                    )
                  )}

                  {activeTab === 'uploads' && (
                    uploads.length === 0 ? (
                      <div className={styles.empty}>还没有上传歌曲</div>
                    ) : (
                      uploads.map((s) => (
                        <div
                          key={s.id}
                          className={styles.listItem}
                          onClick={() => handlePlay(s, uploads)}
                        >
                          <span className={styles.listIcon}>🎵</span>
                          <div className={styles.listInfo}>
                            <div className={styles.listName}>{s.title}</div>
                            <div className={styles.listMeta}>{s.artist}</div>
                          </div>
                          <span className={styles.listArrow}>▶</span>
                        </div>
                      ))
                    )
                  )}

                  {activeTab === 'history' && (
                    histories.length === 0 ? (
                      <div className={styles.empty}>还没有播放记录</div>
                    ) : (
                      histories.map((h) => (
                        <div
                          key={h.id}
                          className={styles.listItem}
                          onClick={() => handlePlay(h.song, histories.map((i) => i.song))}
                        >
                          <span className={styles.listIcon}>🕐</span>
                          <div className={styles.listInfo}>
                            <div className={styles.listName}>{h.song.title}</div>
                            <div className={styles.listMeta}>{h.song.artist}</div>
                          </div>
                          <span className={styles.listTime}>
                            {new Date(h.playedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )
                  )}

                  {activeTab === 'favorites' && (
                    favorites.length === 0 ? (
                      <div className={styles.empty}>还没有收藏歌曲</div>
                    ) : (
                      favorites.map((s) => (
                        <div
                          key={s.id}
                          className={styles.listItem}
                          onClick={() => handlePlay(s, favorites)}
                        >
                          <span className={styles.listIcon}>❤️</span>
                          <div className={styles.listInfo}>
                            <div className={styles.listName}>{s.title}</div>
                            <div className={styles.listMeta}>{s.artist}</div>
                          </div>
                          <button
                            className={styles.unfavBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              favoritesApi.remove(s.id).then(() => setFavorites((prev) => prev.filter((f) => f.id !== s.id)));
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 涟漪层 */}
          {ripples.map((r) => (
            <span
              key={r.id}
              className={styles.ripple}
              style={{ left: r.x - r.size / 2, top: r.y - r.size / 2, width: r.size, height: r.size }}
            />
          ))}
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={styles.toast}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 退出登录确认弹窗 */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              className={styles.confirmDialog}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.confirmIcon}>⚠️</div>
              <div className={styles.confirmTitle}>确认退出</div>
              <div className={styles.confirmDesc}>退出后需要重新登录才能使用</div>
              <div className={styles.confirmActions}>
                <button
                  className={styles.confirmCancel}
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  取消
                </button>
                <button
                  className={styles.confirmOk}
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  退出登录
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 弹窗 */}
      <EditProfileModal
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        initialNickname={user?.nickname || ''}
        onSave={(nickname) => { authApi.updateProfile(nickname).then(() => fetchMe()); }}
      />
      <CreatePlaylistModal
        open={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onCreate={(_name, _desc, _isPublic) => {
          playlistsApi.create({ name: _name, description: _desc, isPublic: _isPublic })
            .then(() => playlistsApi.list().then((r) => setPlaylists(r.data)));
        }}
      />
    </div>
  );
}
