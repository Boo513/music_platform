import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { songsApi } from '@/api/songs';
import { usePlayerStore } from '@/stores/playerStore';
import { SongCard } from '@/components/shared/SongCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SceneBanner } from '@/components/scenes/SceneBanner';
import { STYLE_OPTIONS, type Song, type StyleType } from '@/types';

export default function HomePage() {
 const navigate = useNavigate();
 const { play } = usePlayerStore();
 const [songs, setSongs] = useState<Song[]>([]);
 const [loading, setLoading] = useState(true);
 const [styleFilter, setStyleFilter] = useState<StyleType | null>(null);
 const [selectedScene, setSelectedScene] = useState('auto');
 const [keyword, setKeyword] = useState('');

 useEffect(() => {
 setLoading(true);
 songsApi.list({ style: styleFilter ?? undefined, keyword: keyword || undefined, sort: 'plays' })
 .then((res) => setSongs(res.data.records))
 .catch(() => setSongs([]))
 .finally(() => setLoading(false));
 }, [styleFilter, keyword]);

 const handlePlay = (song: Song) => {
 play(song, songs);
 navigate(`/play/${song.id}`);
 };

 return (
 <div className="min-h-screen pb-24">
 {/* 1. Scene banner */}
 <SceneBanner selectedScene={selectedScene} onSelectScene={setSelectedScene} />

 {/* 2. Search bar + nav */}
 <div className="flex items-center gap-3 px-6 py-4">
 <div className="flex-1 flex items-center gap-2 rounded-3xl glass-panel"
 style={{ padding: '10px 16px' }}>
 <span className="text-base opacity-40">🔍</span>
 <input
 className="text-primary text-13 flex-1"
 placeholder="搜索歌曲或艺术家..." value={keyword} onChange={(e) => setKeyword(e.target.value)}
 />
 </div>
 <button
 className="w-10 h-10  rounded-full flex items-center justify-center
 text-white text-xl border-0 cursor-pointer"
 style={{ boxShadow: '0 0 20px rgba(255,140,66,0.3)' }}
 onClick={() => navigate('/upload')}>+</button>
 <button
 className="w-9 h-9  rounded-full flex items-center justify-center text-sm border-0 cursor-pointer"
 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
 onClick={() => navigate('/profile')}>👤</button>
 </div>

 {/* 3. Quick cards */}
 <div className="flex gap-3 px-6 mb-5">
 {[
 { icon: '📻', title: '推荐电台', desc: '基于你的喜好' },
 { icon: '🔥', title: '热门推荐', desc: '大家都在听' },
 { icon: '🕐', title: '最近播放', desc: '继续收听', onClick: () => navigate('/profile') },
 ].map((card) => (
 <div key={card.title}
 className="flex-1 glass-panel flex items-center gap-3 cursor-pointer transition-colors"
 style={{ padding: '16px' }}
 onClick={card.onClick}>
 <div className="text-2xl">{card.icon}</div>
 <div>
 <div className="text-primary text-sm font-semibold">{card.title}</div>
 <div className="text-primary text-11">{card.desc}</div>
 </div>
 </div>
 ))}
 </div>

 {/* 4. Style filter tags */}
 <div className="flex items-center gap-2 px-6 mb-5 overflow-x-auto pb-1">
 <span className="text-primary text-xs mr-1 flex-shrink-0">风格</span>
 <button
 className={`px-3 py-1.5 rounded-2xl text-11 whitespace-nowrap transition-all border cursor-pointer
 ${!styleFilter
 ? ' font-semibold border-orange-20'
 : ' border-transparent hover-text-white'}`}
 style={!styleFilter ? { background: 'rgba(255,140,66,0.15)' } : { background: 'rgba(255,255,255,0.04)' }}
 onClick={() => setStyleFilter(null)}>🔥 全部</button>
 {STYLE_OPTIONS.map((s) => (
 <button key={s.value}
 className={`px-3 py-1.5 rounded-2xl text-11 whitespace-nowrap transition-all border cursor-pointer
 ${styleFilter === s.value
 ? ' font-semibold border-orange-20'
 : ' border-transparent hover-text-white'}`}
 style={styleFilter === s.value ? { background: 'rgba(255,140,66,0.15)' } : { background: 'rgba(255,255,255,0.04)' }}
 onClick={() => setStyleFilter(s.value)}>{s.emoji} {s.label}</button>
 ))}
 </div>

 {/* 5. Song grid or empty state */}
 {loading ? (
 <div className="flex items-center justify-center py-20 text-sm">加载中...</div>
 ) : songs.length > 0 ? (
 <div className="grid grid-cols-fill gap-3.5 px-6">
 {songs.map((song) => (
 <SongCard key={song.id} song={song} onClick={handlePlay} />
 ))}
 </div>
 ) : (
 <EmptyState
 emoji="🎵"
 title={keyword || styleFilter ? '没有找到匹配的歌曲' : '还没有歌曲，快来上传第一首吧'}
 action={!keyword && !styleFilter ? { label: '上传音乐', onClick: () => navigate('/upload') } : undefined}
 />
 )}
 </div>
 );
}
