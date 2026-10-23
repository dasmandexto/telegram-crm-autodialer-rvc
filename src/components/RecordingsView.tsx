import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Play, 
  Pause, 
  Trash2, 
  Share2, 
  Download, 
  Clock, 
  Calendar, 
  Layers, 
  User, 
  Volume2, 
  CheckCircle2, 
  Search,
  Filter,
  FileAudio
} from 'lucide-react';
import { SavedCallRecording, RecordMode } from '../types';
import { downloadBlob } from '../services/zipExporter';

interface RecordingsViewProps {
  recordings: SavedCallRecording[];
  onDeleteRecording: (id: string) => void;
}

export const RecordingsView: React.FC<RecordingsViewProps> = ({
  recordings,
  onDeleteRecording,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | RecordMode>('ALL');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const activePlayerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter records
  const filteredRecordings = recordings.filter((r) => {
    if (modeFilter !== 'ALL' && r.mode !== modeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.clientName.toLowerCase().includes(q);
      const matchTarget = r.clientTarget.toLowerCase().includes(q);
      const matchVoice = r.rvcVoiceName.toLowerCase().includes(q);
      if (!matchName && !matchTarget && !matchVoice) return false;
    }
    return true;
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Play audio simulation
  const togglePlay = (id: string, durationSecs: number) => {
    if (playingId === id) {
      if (activePlayerTimerRef.current) clearInterval(activePlayerTimerRef.current);
      setPlayingId(null);
      setPlaybackProgress(0);
      return;
    }

    if (activePlayerTimerRef.current) clearInterval(activePlayerTimerRef.current);
    setPlayingId(id);
    setPlaybackProgress(0);

    const stepMs = 250;
    const totalMs = durationSecs * 1000;
    let elapsed = 0;

    activePlayerTimerRef.current = setInterval(() => {
      elapsed += stepMs;
      const progressPercent = Math.min(100, (elapsed / totalMs) * 100);
      setPlaybackProgress(progressPercent);

      if (elapsed >= totalMs) {
        if (activePlayerTimerRef.current) clearInterval(activePlayerTimerRef.current);
        setPlayingId(null);
        setPlaybackProgress(0);
      }
    }, stepMs);
  };

  const handleExportRecording = (rec: SavedCallRecording) => {
    // Generate dummy audio wave blob
    const dummyBlob = new Blob(['RIFF....WAVEfmt ....data....'], { type: 'audio/wav' });
    downloadBlob(dummyBlob, `${rec.title.replace(/\s+/g, '_')}_${rec.mode}.wav`);
  };

  const renderModeBadge = (mode: RecordMode) => {
    if (mode === 'CLIENT_ONLY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
          <User className="w-3 h-3 text-emerald-400" />
          Только клиент
        </span>
      );
    }
    if (mode === 'MULTI_TRACK_STEMS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950/70 text-purple-300 border border-purple-800/60">
          <Layers className="w-3 h-3 text-purple-400" />
          Раздельные Stems
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-950/70 text-sky-300 border border-sky-800/60">
        <Volume2 className="w-3 h-3 text-sky-400" />
        Весь разговор
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/20 shrink-0">
              <FileAudio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Архив записей разговоров (Call Recorder)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-rose-400 border border-slate-700">
                  {recordings.length} файлов
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Записи звонков с раздельным сохранением дорожек (Клиент / RVC микс / Stems)
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <div>
              Объем: <strong className="text-white">{formatFileSize(recordings.reduce((acc, r) => acc + r.fileSizeBytes, 0))}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по абоненту, модели RVC..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setModeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              modeFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setModeFilter('CLIENT_ONLY')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              modeFilter === 'CLIENT_ONLY' ? 'bg-slate-800 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Только клиент
          </button>
          <button
            onClick={() => setModeFilter('FULL_CALL_MIX')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              modeFilter === 'FULL_CALL_MIX' ? 'bg-slate-800 text-sky-300 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Весь разговор
          </button>
          <button
            onClick={() => setModeFilter('MULTI_TRACK_STEMS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              modeFilter === 'MULTI_TRACK_STEMS' ? 'bg-slate-800 text-purple-300 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stems
          </button>
        </div>
      </div>

      {/* Recordings List */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredRecordings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Mic className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-slate-300">Записей разговоров пока нет</p>
            <p className="text-xs text-slate-500 mt-1">
              Нажмите кнопку [🔴 REC] во время звонка или на плавающей панели для старта записи.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredRecordings.map((rec) => {
              const isPlaying = playingId === rec.id;

              return (
                <div
                  key={rec.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 hover:bg-slate-850/40 transition-colors"
                >
                  {/* Left: Play button & Meta */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => togglePlay(rec.id, rec.durationSeconds)}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md transition-all active:scale-95 ${
                        isPlaying
                          ? 'bg-rose-600 ring-4 ring-rose-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">
                          {rec.title}
                        </span>
                        {renderModeBadge(rec.mode)}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                        <span>{rec.clientTarget}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(rec.durationSeconds)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{rec.dateTime}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-purple-300">
                          RVC: {rec.rvcVoiceName} ({rec.rvcPitch > 0 ? `+${rec.rvcPitch}` : rec.rvcPitch})
                        </span>
                      </div>

                      {/* Seek Bar when playing */}
                      {isPlaying && (
                        <div className="mt-2 w-full max-w-md h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-200"
                            style={{ width: `${playbackProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => handleExportRecording(rec)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                      title="Экспорт / Скачать аудиофайл"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Экспорт WAV</span>
                    </button>

                    <button
                      onClick={() => onDeleteRecording(rec.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
