import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  User, 
  Shield, 
  Volume2, 
  Network, 
  Sparkles, 
  Radio, 
  Square, 
  Circle, 
  Layers, 
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Check,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Contact, TelegramAccount, RecordMode, RvcSettings, RvcVoiceModel } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { sounds } from '../services/soundEffects';
import { RvcService } from '../services/rvcService';

interface ActiveCallModalProps {
  contact: Contact;
  account: TelegramAccount;
  proxyUsed?: string;
  onEndCall: (durationSeconds: number) => void;
  // RVC controls
  rvcSettings: RvcSettings;
  onUpdateRvcSettings: (settings: RvcSettings) => void;
  voices: RvcVoiceModel[];
  // Recorder controls
  isRecording: boolean;
  recordDuration: number;
  recordMode: RecordMode;
  onChangeRecordMode: (mode: RecordMode) => void;
  onToggleRecord: () => void;
  // Floating overlay toggle
  onToggleOverlay: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  contact,
  account,
  proxyUsed,
  onEndCall,
  rvcSettings,
  onUpdateRvcSettings,
  voices,
  isRecording,
  recordDuration,
  recordMode,
  onChangeRecordMode,
  onToggleRecord,
  onToggleOverlay,
}) => {
  const [callState, setCallState] = useState<'dialing' | 'connected'>('dialing');
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ voiceName: string; latencyMs: number } | null>(null);

  // Play dialing ring tone and auto-connect after 2.5s
  useEffect(() => {
    sounds.startDialingRing();

    const connectTimeout = setTimeout(() => {
      setCallState('connected');
      sounds.playConnectedChime();
    }, 2800);

    return () => {
      sounds.stopDialingRing();
      clearTimeout(connectTimeout);
    };
  }, []);

  // Timer when connected
  useEffect(() => {
    if (callState !== 'connected') return;

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  // Dismiss feedback toast automatically
  useEffect(() => {
    if (!feedbackToast) return;
    const timer = setTimeout(() => {
      setFeedbackToast(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, [feedbackToast]);

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sounds.playMuteClick(nextState);
  };

  const handleHangup = () => {
    sounds.playHangupBeep();
    onEndCall(duration);
  };

  const handleQuickVoiceSwitch = async (voiceId: string) => {
    if (voiceId === rvcSettings.activeVoiceId && !rvcSettings.isSwitching) return;

    const targetVoice = voices.find((v) => v.id === voiceId);
    const newPitch = targetVoice ? targetVoice.recommendedPitch : rvcSettings.pitch;

    // Trigger tactile audio feedback immediately
    sounds.playVoiceSwap(newPitch);

    onUpdateRvcSettings({
      ...rvcSettings,
      isSwitching: true,
    });

    const res = await RvcService.switchVoiceOnTheFly(
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

    setShowVoiceMenu(false);

    // Show tactile visual toast
    setFeedbackToast({
      voiceName: targetVoice?.name.split(' ')[0] || voiceId,
      latencyMs: res.latencyMs || 22,
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const activeVoice = voices.find((v) => v.id === rvcSettings.activeVoiceId) || voices[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0e1626] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Top Header info */}
        <div className="px-5 pt-5 pb-3 text-center border-b border-slate-800/60 shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Звонок:</span>
              <span className="font-semibold text-emerald-400">{account.username}</span>
            </div>

            {proxyUsed && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-950/70 text-sky-300 border border-sky-800/60">
                <Network className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-mono text-sky-200">{proxyUsed}</span>
              </div>
            )}

            <button
              onClick={onToggleOverlay}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/50 hover:bg-purple-900/50 transition-colors"
              title="Открыть плавающее окно управления поверх звонка"
            >
              <ExternalLink className="w-3 h-3 text-purple-400" />
              <span>Floating Overlay</span>
            </button>
          </div>

          <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight">
            {contact.name || contact.target}
          </h2>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-2">
            <span>{contact.target}</span>
            {contact.company && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300">{contact.company}</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Avatar & Call State */}
        <div className="py-5 px-5 flex flex-col items-center justify-center text-center shrink-0">
          <div className="relative mb-3">
            <motion.div 
              animate={rvcSettings.isSwitching ? { scale: [1, 1.06, 1], filter: 'brightness(1.2)' } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                callState === 'connected' ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-4 ring-emerald-500/30' : 'bg-slate-700 ring-4 ring-slate-600/40 animate-pulse'
              }`}
            >
              <User className="w-10 h-10 sm:w-12 sm:h-12" />
            </motion.div>

            {callState === 'connected' && (
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0e1626] flex items-center justify-center text-slate-950">
                <Volume2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Status text & timer */}
          <div className="text-center">
            {callState === 'dialing' ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-400 animate-pulse">
                  Гудки... Соединение с клиентом
                </p>
                <p className="text-[11px] text-slate-400">Telegram VoIP протокол MTProto</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
                  В эфире (Идет разговор)
                </p>
                <p className="text-3xl sm:text-4xl font-mono font-bold text-white tabular-nums tracking-wider">
                  {formatTime(duration)}
                </p>
              </div>
            )}
          </div>

          {/* Audio Wave Visualizer */}
          <div className="w-full mt-4">
            <AudioVisualizer isMuted={isMuted} isActive={callState === 'connected'} />
            {isMuted && (
              <p className="text-xs font-semibold text-rose-400 mt-1">Микрофон выключен</p>
            )}
          </div>
        </div>

        {/* Live RVC Voice & Recorder Toolstrip */}
        <div className="px-5 py-3.5 bg-slate-900/80 border-t border-slate-800/80 space-y-3">
          
          {/* Row 1: RVC Hot-Swap in Call with tactile feedback */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                {/* Animated Sparkles Icon with Pulse */}
                <motion.div 
                  animate={rvcSettings.isSwitching ? { rotate: [0, 180, 360], scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={rvcSettings.isSwitching ? { repeat: Infinity, duration: 0.65, ease: "linear" } : { duration: 0.2 }}
                  className="w-7 h-7 rounded-lg bg-purple-950/90 border border-purple-700/60 flex items-center justify-center text-purple-400 shadow-md shadow-purple-950/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </motion.div>
                
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <span>RVC Голос «на лету»</span>
                    {rvcSettings.isSwitching && (
                      <span className="text-[9px] text-amber-400 font-bold animate-pulse">
                        (Переключение...)
                      </span>
                    )}
                  </div>
                  
                  {/* Smooth Text Morphing when voice switches */}
                  <div className="h-5 flex items-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeVoice?.id}
                        initial={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="text-xs font-bold text-purple-200 flex items-center gap-1.5"
                      >
                        <span className="truncate">{activeVoice?.name.split(' ')[0] || 'Default'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({rvcSettings.pitch > 0 ? `+${rvcSettings.pitch}` : rvcSettings.pitch} st)
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Hot-Swap Voice Menu Dropdown Button */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors shadow-sm ${
                    showVoiceMenu 
                      ? 'bg-purple-900/60 text-purple-200 border-purple-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <span>{rvcSettings.isSwitching ? 'Смена...' : 'Все голоса'}</span>
                  <motion.div
                    animate={{ rotate: showVoiceMenu ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </motion.div>
                </motion.button>

                {/* Animated Dropdown Menu */}
                <AnimatePresence>
                  {showVoiceMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      className="absolute right-0 bottom-full mb-1.5 w-60 bg-slate-900/95 border border-purple-800/60 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md"
                    >
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2.5 py-1 flex items-center justify-between">
                        <span>Каталог RVC</span>
                        <span className="text-[9px] text-purple-400">1-тап переключение</span>
                      </div>
                      <div className="space-y-0.5 max-h-48 overflow-y-auto">
                        {voices.map((v) => {
                          const isSelected = v.id === rvcSettings.activeVoiceId;
                          return (
                            <motion.button
                              key={v.id}
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleQuickVoiceSwitch(v.id)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-purple-950/90 text-purple-200 font-bold border border-purple-700/60 shadow-sm'
                                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate">{v.name}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {v.recommendedPitch > 0 ? `+${v.recommendedPitch}` : v.recommendedPitch}st
                                </span>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                  >
                                    <Check className="w-3.5 h-3.5 text-purple-400 ml-1" />
                                  </motion.div>
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tactile Voice Carousel / Pills Track for 1-Tap Switching */}
            <div className="relative flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {voices.slice(0, 4).map((v) => {
                const isActive = v.id === rvcSettings.activeVoiceId;
                const shortLabel = v.name.split(' ')[0];
                return (
                  <motion.button
                    key={v.id}
                    onClick={() => handleQuickVoiceSwitch(v.id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.94 }}
                    className={`relative px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                      isActive 
                        ? 'text-white font-semibold' 
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950/40 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Morphing Gliding Indicator via layoutId */}
                    {isActive && (
                      <motion.div
                        layoutId="activeVoicePillGlow"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-800/90 to-indigo-700/90 border border-purple-500/70 shadow-md shadow-purple-900/40"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1">
                      {isActive && <Zap className="w-3 h-3 text-purple-300 animate-pulse" />}
                      <span>{shortLabel}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Tactile Feedback Confirmation Toast */}
            <AnimatePresence>
              {feedbackToast && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 flex items-center gap-1.5 text-[11px] text-purple-300 bg-purple-950/80 border border-purple-700/50 rounded-lg px-2.5 py-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Голос сменен на <strong>{feedbackToast.voiceName}</strong> ({feedbackToast.latencyMs}ms)</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Row 2: Recorder Controller with Mode Picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            {/* Record Modes */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80 text-[10px]">
              <span className="text-slate-400 px-1 font-semibold">REC:</span>
              <button
                onClick={() => onChangeRecordMode('CLIENT_ONLY')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  recordMode === 'CLIENT_ONLY'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Записывать только голос клиента"
              >
                Клиент
              </button>
              <button
                onClick={() => onChangeRecordMode('FULL_CALL_MIX')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  recordMode === 'FULL_CALL_MIX'
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Записывать полный разговор"
              >
                Микс
              </button>
              <button
                onClick={() => onChangeRecordMode('MULTI_TRACK_STEMS')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  recordMode === 'MULTI_TRACK_STEMS'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Раздельные дорожки Stems"
              >
                Stems
              </button>
            </div>

            {/* REC Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onToggleRecord}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>REC {formatTime(recordDuration)}</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>Запись [🔴 REC]</span>
                </>
              )}
            </motion.button>
          </div>

        </div>

        {/* Main Action Controls: Mute and Hangup */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-5 shrink-0">
          {/* Mute button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleMute}
            className={`min-h-[50px] min-w-[50px] sm:min-h-[54px] sm:min-w-[54px] rounded-2xl flex flex-col items-center justify-center transition-all ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-md shadow-rose-500/20'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-1">
              {isMuted ? 'Вкл. микр.' : 'Выкл. микр.'}
            </span>
          </motion.button>

          {/* End Call button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleHangup}
            className="min-h-[50px] px-8 sm:min-h-[54px] sm:px-10 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-3 shadow-lg shadow-rose-600/30 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-base font-bold">Завершить звонок</span>
          </motion.button>
        </div>

      </div>
    </div>
  );
};
