import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Mic, 
  Square, 
  Circle, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  User, 
  Volume2, 
  X, 
  Check, 
  Radio, 
  Minimize2, 
  Maximize2,
  Move
} from 'lucide-react';
import { RecordMode, RvcSettings, RvcVoiceModel } from '../types';
import { RvcService } from '../services/rvcService';

interface FloatingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  // RVC state & controls
  rvcSettings: RvcSettings;
  onUpdateRvcSettings: (settings: RvcSettings) => void;
  voices: RvcVoiceModel[];
  // Recorder state & controls
  isRecording: boolean;
  recordDuration: number;
  recordMode: RecordMode;
  onChangeRecordMode: (mode: RecordMode) => void;
  onToggleRecord: () => void;
  // Context
  clientName?: string;
}

export const FloatingOverlay: React.FC<FloatingOverlayProps> = ({
  isOpen,
  onClose,
  rvcSettings,
  onUpdateRvcSettings,
  voices,
  isRecording,
  recordDuration,
  recordMode,
  onChangeRecordMode,
  onToggleRecord,
  clientName,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSliders, setShowSliders] = useState(false);

  // Quick switch voice
  const handleSelectVoice = async (voiceId: string) => {
    if (voiceId === rvcSettings.activeVoiceId) return;

    onUpdateRvcSettings({
      ...rvcSettings,
      isSwitching: true,
    });

    const targetVoice = voices.find((v) => v.id === voiceId);
    const newPitch = targetVoice ? targetVoice.recommendedPitch : rvcSettings.pitch;

    await RvcService.switchVoiceOnTheFly(
      voiceId,
      newPitch,
      rvcSettings.indexRate,
      rvcSettings.protect
    );

    onUpdateRvcSettings({
      ...rvcSettings,
      activeVoiceId: voiceId,
      pitch: newPitch,
      isSwitching: false,
    });
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0e1626]/95 border border-slate-700/90 shadow-2xl rounded-full p-2 text-white backdrop-blur-md animate-scaleIn">
        {isRecording && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-mono font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            REC {formatTimer(recordDuration)}
          </span>
        )}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-purple-300">
            {voices.find((v) => v.id === rvcSettings.activeVoiceId)?.name.split(' ')[0] || 'RVC Voice'}
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 transition-colors"
          title="Развернуть Overlay"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 w-84 sm:w-96 bg-[#0e1626]/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-white transition-all animate-fadeIn">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 cursor-move">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            RVC & REC Overlay
          </span>
          {clientName && (
            <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
              · {clientName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Свернуть в мини-виджет"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
            title="Закрыть оверлей"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* 1. Hot-Swap Voice Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Голос RVC (Hot-Swap «на лету»):
            </span>
            {rvcSettings.isSwitching && (
              <span className="text-[10px] font-bold text-amber-400 animate-pulse">
                Переключение...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {voices.map((v) => {
              const isActive = v.id === rvcSettings.activeVoiceId;
              return (
                <button
                  key={v.id}
                  onClick={() => handleSelectVoice(v.id)}
                  disabled={rvcSettings.isSwitching}
                  className={`px-2.5 py-1.5 rounded-lg text-left transition-all text-xs flex items-center justify-between border ${
                    isActive
                      ? 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-sm font-semibold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="truncate">{v.name.split(' ')[0]}</span>
                  {isActive ? (
                    <Check className="w-3 h-3 text-purple-400 shrink-0 ml-1" />
                  ) : (
                    <span className="text-[10px] text-slate-400">{v.gender === 'female' ? '♀' : '♂'}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Pitch & Controls toggle */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Pitch (Тон):</span>
            <div className="flex items-center gap-1 font-mono">
              {[-12, 0, 6, 12].map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdateRvcSettings({ ...rvcSettings, pitch: p })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    rvcSettings.pitch === p
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {p > 0 ? `+${p}` : p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Call Recorder Section */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              Call Recorder:
            </span>

            {/* Mode selection badge */}
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {recordMode}
            </span>
          </div>

          {/* Record Source Mode segmented buttons */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 mb-3 text-[10px] font-medium text-center">
            <button
              onClick={() => onChangeRecordMode('CLIENT_ONLY')}
              className={`py-1 rounded transition-all ${
                recordMode === 'CLIENT_ONLY'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Только голос клиента"
            >
              Client
            </button>
            <button
              onClick={() => onChangeRecordMode('FULL_CALL_MIX')}
              className={`py-1 rounded transition-all ${
                recordMode === 'FULL_CALL_MIX'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Весь разговор (микс)"
            >
              Full Mix
            </button>
            <button
              onClick={() => onChangeRecordMode('MULTI_TRACK_STEMS')}
              className={`py-1 rounded transition-all ${
                recordMode === 'MULTI_TRACK_STEMS'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Раздельные дорожки Stems"
            >
              Stems
            </button>
          </div>

          {/* Big REC button */}
          <button
            onClick={onToggleRecord}
            className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-md active:scale-98 ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>Остановить REC ({formatTimer(recordDuration)})</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>Начать запись [🔴 REC]</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
