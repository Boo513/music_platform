import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/stores/playerStore';

const GENRES = ['全部', '摇滚', '流行', '电子', '古典', '民谣', '爵士', '嘻哈', 'R&B'];

const DEMO_SONGS = [
  { id: 1, title: '赛博夜曲', artist: 'Neon Waves', vip: true, genre: '电子' },
  { id: 2, title: '星海漫游', artist: 'Cosmic Drift', vip: false, genre: '古典' },
  { id: 3, title: '樱花雨', artist: 'Spring Echo', vip: true, genre: '流行' },
  { id: 4, title: '夏日浪潮', artist: 'Beach Fire', vip: false, genre: '摇滚' },
  { id: 5, title: '雨中霓虹', artist: 'Rain City', vip: true, genre: '爵士' },
  { id: 6, title: '山间清风', artist: 'Forest Breath', vip: false, genre: '民谣' },
];

export function MusicList() {
  const [activeGenre, setActiveGenre] = useState('全部');
  const navigate = useNavigate();
  const { play } = usePlayerStore();

  const handlePlay = (id: number) => {
    navigate(`/play/${id}`);
  };

  return (
    <div className="music-list">
      <div className="genre-tags">
        {GENRES.map((g) => (
          <button
            key={g}
            className={`genre-tag ${activeGenre === g ? 'active' : ''}`}
            onClick={() => setActiveGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="song-list">
        {DEMO_SONGS.map((s) => (
          <div key={s.id} className="song-row" onClick={() => handlePlay(s.id)}>
            <div className="song-info">
              <span className="song-title">{s.title}</span>
              <span className="song-artist">{s.artist}</span>
            </div>
            {s.vip && <span className="song-vip">VIP</span>}
            <span className="song-play">▶</span>
          </div>
        ))}
      </div>
    </div>
  );
}
