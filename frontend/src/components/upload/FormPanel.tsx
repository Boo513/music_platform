import { useUploadStore } from '@/stores/useUploadStore';
import { STYLE_OPTIONS, MOOD_OPTIONS } from '@/types';

export function FormPanel() {
  const { title, artist, style, mood, setTitle, setArtist, setStyle, setMood } = useUploadStore();

  return (
    <div className="up-form">
      <div className="up-field">
        <label className="up-label">TITLE</label>
        <input
          className="up-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter track name..."
        />
      </div>

      <div className="up-field">
        <label className="up-label">ARTIST</label>
        <input
          className="up-input"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Enter artist name..."
        />
      </div>

      <div className="up-field">
        <label className="up-label">STYLE</label>
        <div className="up-tags">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.value}
              className={`up-tag ${style === s.value ? 'active' : ''}`}
              onClick={() => setStyle(s.value)}
            >{s.emoji} {s.label}</button>
          ))}
        </div>
      </div>

      <div className="up-field">
        <label className="up-label">MOOD</label>
        <div className="up-tags">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.value}
              className={`up-tag ${mood === m.value ? 'active' : ''}`}
              onClick={() => setMood(m.value)}
            >{m.emoji} {m.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
