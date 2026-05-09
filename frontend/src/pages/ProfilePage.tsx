import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { playlistsApi } from '@/api/playlists';
import { songsApi } from '@/api/songs';
import { favoritesApi } from '@/api/favorites';
import { historyApi } from '@/api/history';
import { SongRow } from '@/components/shared/SongRow';
import { EmptyState } from '@/components/shared/EmptyState';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { CreatePlaylistModal } from '@/components/modals/CreatePlaylistModal';
import type { Song, Playlist, PlayHistoryItem } from '@/types';

type TabKey = 'playlists' | 'uploads' | 'history' | 'favorites';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, fetchMe } = useAuthStore();
  const { play } = usePlayerStore();
  const [tab, setTab] = useState<TabKey>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [uploads, setUploads] = useState<Song[]>([]);
  const [histories, setHistories] = useState<PlayHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    playlistsApi.list().then((r) => setPlaylists(r.data)).catch(() => {});
    songsApi.list({ sort: 'newest' }).then((r) => setUploads(r.data.records)).catch(() => {});
    historyApi.list().then((r) => setHistories(r.data.records)).catch(() => {});
    favoritesApi.list().then((r) => setFavorites(r.data.records)).catch(() => {});
  }, []);

  if (!user) return null;

  const tabs: { key: TabKey; label: string; emoji: string }[] = [
    { key: 'playlists', label: '我的歌单', emoji: '📋' },
    { key: 'uploads', label: '上传歌曲', emoji: '🎵' },
    { key: 'history', label: '播放历史', emoji: '🕐' },
    { key: 'favorites', label: '我的收藏', emoji: '❤️' },
  ];

  const handlePlay = (song: Song, list: Song[]) => { play(song, list); navigate(`/play/${song.id}`); };

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="fixed inset-0 -z-10 opacity-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(80,40,150,0.4),transparent_55%)]" />

      <div className="flex items-center gap-5 px-8 pt-7 pb-5">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2a1840] to-[#141028]
            border-[3px] border-[#FFB366]/20 shadow-[0_0_35px_rgba(255,140,66,0.12)]
            flex items-center justify-center text-4xl">🌌</div>
          <div className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full bg-[#FF8C42]
            border-2 border-[#0a0a18] flex items-center justify-center text-[10px] text-white cursor-pointer">✎</div>
        </div>
        <div className="flex-1">
          <div className="text-[22px] font-bold text-[#f0e6e0]">{user.nickname}</div>
          <div className="text-[#a09080] text-xs mt-1">@{user.username}</div>
          <div className="flex gap-7 mt-3">
            <div><span className="text-[#FFB366] font-bold text-lg">{uploads.length}</span> <span className="text-[#a09080] text-[11px]">上传</span></div>
            <div><span className="text-[#FFB366] font-bold text-lg">{favorites.length}</span> <span className="text-[#a09080] text-[11px]">收藏</span></div>
            <div><span className="text-[#FFB366] font-bold text-lg">{playlists.length}</span> <span className="text-[#a09080] text-[11px]">歌单</span></div>
          </div>
        </div>
        <button className="px-5 py-2 rounded-2xl border border-white/[0.1] text-[#d0c0b0] text-xs"
          onClick={() => setShowEditProfile(true)}>✎ 编辑资料</button>
      </div>

      <div className="flex gap-0 px-8 border-b border-white/[0.06]">
        {tabs.map((t) => (
          <button key={t.key}
            className={`px-5 py-3 text-[13px] font-semibold transition-all border-b-2
              ${tab === t.key ? 'text-[#FFB366] border-[#FF8C42]' : 'text-[#a09080] border-transparent'}`}
            onClick={() => setTab(t.key)}>{t.emoji} {t.label}</button>
        ))}
      </div>

      <div className="px-8 pt-5">
        {tab === 'playlists' && (
          <div className="flex gap-3.5 overflow-x-auto pb-4">
            {playlists.map((pl) => (
              <div key={pl.id}
                className="min-w-[175px] glass-panel rounded-2xl overflow-hidden cursor-pointer">
                <div className="h-20 bg-gradient-to-br from-[#2a1840] to-[#4a2040] flex items-center justify-center text-3xl">🎸</div>
                <div className="p-3"><div className="text-[#f0e6e0] text-[13px] font-semibold">{pl.name}</div>
                  <div className="text-[#a09080] text-[11px]">{pl.songCount} 首 · {pl.isPublic ? '公开' : '私密 🔒'}</div></div>
              </div>
            ))}
            <div className="min-w-[175px] border-2 border-dashed border-white/[0.08] rounded-2xl
              flex flex-col items-center justify-center text-white/20 text-2xl cursor-pointer"
              onClick={() => setShowCreatePlaylist(true)}>+<div className="text-[11px] mt-1">新建歌单</div></div>
          </div>
        )}

        {tab === 'uploads' && (
          uploads.length === 0
            ? <EmptyState emoji="🎵" title="还没有上传歌曲" action={{ label: '去上传', onClick: () => navigate('/upload') }} />
            : <div className="flex flex-col gap-2">{uploads.map((s) => <SongRow key={s.id} song={s} onClick={(s) => handlePlay(s, uploads)} />)}</div>
        )}

        {tab === 'history' && (
          histories.length === 0
            ? <EmptyState emoji="🕐" title="还没有播放记录" />
            : <div className="flex flex-col gap-2">
                {(() => {
                  const groups = new Map<string, PlayHistoryItem[]>();
                  histories.forEach((h) => {
                    const d = new Date(h.playedAt);
                    const key = d.toDateString() === new Date().toDateString() ? '今天'
                      : d.toDateString() === new Date(Date.now() - 86400000).toDateString() ? '昨天' : '更早';
                    groups.set(key, [...(groups.get(key) || []), h]);
                  });
                  return Array.from(groups.entries()).map(([label, items]) => (
                    <div key={label}>
                      <div className="text-[#a09080] text-[11px] px-1 py-2">{label}</div>
                      {items.map((h) => <SongRow key={h.id} song={h.song} onClick={(s) => handlePlay(s, items.map((i) => i.song))}
                        extra={<span className="text-[#a09080] text-[10px] w-12 text-right">{new Date(h.playedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>} />)}
                    </div>
                  ));
                })()}
              </div>
        )}

        {tab === 'favorites' && (
          favorites.length === 0
            ? <EmptyState emoji="❤️" title="还没有收藏歌曲" />
            : <div className="flex flex-col gap-2">
                {favorites.map((s) => (
                  <SongRow key={s.id} song={s} onClick={(s) => handlePlay(s, favorites)}
                    extra={
                      <button className="text-red-400 text-sm hover:scale-110 transition-transform"
                        onClick={(e) => { e.stopPropagation(); favoritesApi.remove(s.id).then(() => setFavorites(favorites.filter((f) => f.id !== s.id))); }}>❤️</button>
                    } />
                ))}
              </div>
        )}
      </div>

      <EditProfileModal open={showEditProfile} onClose={() => setShowEditProfile(false)}
        initialNickname={user.nickname} onSave={() => fetchMe()} />
      <CreatePlaylistModal open={showCreatePlaylist} onClose={() => setShowCreatePlaylist(false)}
        onCreate={(name, desc, isPublic) => {
          playlistsApi.create({ name, description: desc, isPublic }).then(() => playlistsApi.list().then((r) => setPlaylists(r.data)));
        }} />
    </div>
  );
}
