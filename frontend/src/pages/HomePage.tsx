import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { songsApi } from '@/api/songs';
import { usePlayerStore } from '@/stores/playerStore';
import { SongCard } from '@/components/shared/SongCard';
import { SceneBanner } from '@/components/scenes/SceneBanner';
import { STYLE_OPTIONS, type Song, type StyleType } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();
  const { play } = usePlayerStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [styleFilter, setStyleFilter] = useState<StyleType | null>(null);
  const [selectedScene, setSelectedScene] = useState('auto');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    songsApi.list({ style: styleFilter ?? undefined, keyword: keyword || undefined, sort: 'plays' })
      .then((res) => setSongs(res.data.records))
      .catch(() => {});
  }, [styleFilter, keyword]);

  const handlePlay = (song: Song) => {
    play(song, songs);
    navigate(`/play/${song.id}`);
  };

  return (
    <div className="pb-24">
      {/* 1. Scene banner */}
      <SceneBanner selectedScene={selectedScene} onSelectScene={setSelectedScene} />

      {/* 2. Search bar */}
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="flex-1 flex items-center gap-2 glass-panel rounded-3xl !p-2.5 px-4">
          <span>🔍</span>
          <input
            className="bg-transparent border-none outline-none text-[#f0e6e0] text-[13px] flex-1 placeholder-[#a09080]"
            placeholder="搜索歌曲或艺术家..." value={keyword} onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <button
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8C42] to-[#FFB366] flex items-center justify-center
            text-white text-xl shadow-[0_0_20px_rgba(255,140,66,0.3)]"
          onClick={() => navigate('/upload')}>+</button>
        <button
          className="w-9 h-9 rounded-full bg-white/3 border border-white/8 flex items-center justify-center text-sm"
          onClick={() => navigate('/profile')}>👤</button>
      </div>

      {/* 3. Quick cards */}
      <div className="flex gap-3 px-6 mb-4">
        {[
          { icon: '📻', title: '推荐电台', desc: '基于你的喜好' },
          { icon: '🔥', title: '热门推荐', desc: '大家都在听' },
          { icon: '🕐', title: '最近播放', desc: '继续收听', onClick: () => navigate('/profile') },
        ].map((card) => (
          <div key={card.title}
            className="flex-1 glass-panel !p-4 flex items-center gap-3 cursor-pointer hover:bg-white/6"
            onClick={card.onClick}>
            <div className="text-2xl">{card.icon}</div>
            <div>
              <div className="text-[#f0e6e0] text-sm font-semibold">{card.title}</div>
              <div className="text-[#a09080] text-[11px]">{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Style filter tags */}
      <div className="flex items-center gap-2 px-6 mb-4 overflow-x-auto">
        <span className="text-[#a09080] text-xs mr-1">风格</span>
        <button
          className={`px-3 py-1.5 rounded-2xl text-[11px] whitespace-nowrap transition-all
            ${!styleFilter ? 'bg-[#FF8C42]/15 border border-[#FFB366]/20 text-[#FFB366] font-semibold'
                         : 'bg-white/4 text-[#a09080] hover:bg-white/6'}`}
          onClick={() => setStyleFilter(null)}>🔥 全部</button>
        {STYLE_OPTIONS.map((s) => (
          <button key={s.value}
            className={`px-3 py-1.5 rounded-2xl text-[11px] whitespace-nowrap transition-all
              ${styleFilter === s.value ? 'bg-[#FF8C42]/15 border border-[#FFB366]/20 text-[#FFB366] font-semibold'
                                       : 'bg-white/4 text-[#a09080] hover:bg-white/6'}`}
            onClick={() => setStyleFilter(s.value)}>{s.emoji} {s.label}</button>
        ))}
      </div>

      {/* 5. Song grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(155px,1fr))] gap-3.5 px-6">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} onClick={handlePlay} />
        ))}
      </div>
    </div>
  );
}
