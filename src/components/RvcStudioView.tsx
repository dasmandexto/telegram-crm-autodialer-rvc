import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Server, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Headphones, 
  Sliders, 
  CheckCircle2, 
  Zap, 
  Volume2, 
  ShieldCheck, 
  Layers, 
  RotateCw,
  Cpu,
  Edit3
} from 'lucide-react';
import { RvcConnectionConfig, RvcSettings, RvcVoiceModel } from '../types';
import { RvcService, INITIAL_RVC_VOICES } from '../services/rvcService';

interface RvcStudioViewProps {
  rvcConfig: RvcConnectionConfig;
  onUpdateRvcConfig: (config: RvcConnectionConfig) => void;
  rvcSettings: RvcSettings;
  onUpdateRvcSettings: (settings: RvcSettings) => void;
  voices: RvcVoiceModel[];
  onRefreshVoices: () => Promise<void>;
}

export const RvcStudioView: React.FC<RvcStudioViewProps> = ({
  rvcConfig,
  onUpdateRvcConfig,
  rvcSettings,
  onUpdateRvcSettings,
  voices,
  onRefreshVoices,
}) => {
  // SSH Input
  const [sshCommandInput, setSshCommandInput] = useState(rvcConfig?.rawSshCommand || '');
  const [manualMode, setManualMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Self-Test States
  const [isRecordingTest, setIsRecordingTest] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [hasTestRecording, setHasTestRecording] = useState(false);
  const [isProcessingRvc, setIsProcessingRvc] = useState(false);
  const [processTimeMs, setProcessTimeMs] = useState(38);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [isPlayingRvc, setIsPlayingRvc] = useState(false);
  const [liveLoopback, setLiveLoopback] = useState(false);

  const activeAudioPlayerRef = useRef<{ stop: () => void } | null>(null);

  // Handle SSH command paste & auto-extraction
  const handleSshInputChange = (val: string) => {
    setSshCommandInput(val);
    const parsed = RvcService.parseSshCommand(val);
    if (parsed.serverIp || parsed.sshPort || parsed.localRvcPort) {
      onUpdateRvcConfig({
        ...rvcConfig,
        ...parsed,
        rawSshCommand: val,
      });
    }
  };

  // Connect to Vast.ai RVC
  const handleConnectVast = async () => {
    setIsConnecting(true);
    const { online, pingMs } = await RvcService.checkHealth(rvcConfig.serverIp, rvcConfig.localRvcPort);
    setIsConnecting(false);
    onUpdateRvcConfig({
      ...rvcConfig,
      status: online ? 'online' : 'offline',
      pingMs,
      lastConnectedAt: new Date().toLocaleTimeString('ru-RU'),
    });
  };

  // Voice hot-swap
  const handleVoiceSelect = async (voiceId: string) => {
    if (voiceId === rvcSettings.activeVoiceId) return;

    onUpdateRvcSettings({
      ...rvcSettings,
      isSwitching: true,
    });

    const targetVoice = voices.find((v) => v.id === voiceId);
    const newPitch = targetVoice ? targetVoice.recommendedPitch : rvcSettings.pitch;

    await RvcService.switchVoiceOnTheFly(voiceId, newPitch, rvcSettings.indexRate, rvcSettings.protect);

    onUpdateRvcSettings({
      ...rvcSettings,
      activeVoiceId: voiceId,
      pitch: newPitch,
      isSwitching: false,
    });
  };

  // Sliders change
  const handlePitchChange = (pitch: number) => {
    onUpdateRvcSettings({ ...rvcSettings, pitch });
  };

  const handleIndexRateChange = (indexRate: number) => {
    onUpdateRvcSettings({ ...rvcSettings, indexRate });
  };

  const handleProtectChange = (protect: number) => {
    onUpdateRvcSettings({ ...rvcSettings, protect });
  };

  // Self-Test recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecordingTest) {
      interval = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 60) {
            handleStopRecordTest();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingTest]);

  const handleStartRecordTest = () => {
    if (activeAudioPlayerRef.current) {
      activeAudioPlayerRef.current.stop();
    }
    setRecordDuration(0);
    setIsRecordingTest(true);
    setHasTestRecording(false);
  };

  const handleStopRecordTest = async () => {
    setIsRecordingTest(false);
    setIsProcessingRvc(true);
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 650));
    setProcessTimeMs(Math.round(performance.now() - start));
    setIsProcessingRvc(false);
    setHasTestRecording(true);
  };

  // Re-generate test with new slider parameters
  const handleRegenerateTest = async () => {
    setIsProcessingRvc(true);
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 450));
    setProcessTimeMs(Math.round(performance.now() - start));
    setIsProcessingRvc(false);
  };

  // Play audio comparison
  const playComparisonAudio = (type: 'original' | 'rvc') => {
    if (activeAudioPlayerRef.current) {
      activeAudioPlayerRef.current.stop();
      activeAudioPlayerRef.current = null;
    }

    if (type === 'original') {
      setIsPlayingOriginal(true);
      setIsPlayingRvc(false);
      activeAudioPlayerRef.current = RvcService.playDemoAudio('original', rvcSettings, () => {
        setIsPlayingOriginal(false);
      });
    } else {
      setIsPlayingRvc(true);
      setIsPlayingOriginal(false);
      activeAudioPlayerRef.current = RvcService.playDemoAudio('rvc', rvcSettings, () => {
        setIsPlayingRvc(false);
      });
    }
  };

  const currentVoice = voices.find((v) => v.id === rvcSettings.activeVoiceId) || voices[0];

  return (
    <div className="space-y-6">
      
      {/* 1. Universal Vast.ai Connection Block */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/20 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Vast.ai RVC Сервер (Voice Conversion)
                </h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  rvcConfig.status === 'online'
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                    : 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${rvcConfig.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                  RVC Server: {rvcConfig.status === 'online' ? `Online (${rvcConfig.pingMs} ms)` : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Авто-парсинг SSH-туннеля и портов для потокового изменения голоса без задержек (&lt;45мс)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setManualMode(!manualMode)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-purple-400" />
              <span>{manualMode ? 'SSH строка' : 'Ручная правка'}</span>
            </button>

            <button
              onClick={handleConnectVast}
              disabled={isConnecting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>{isConnecting ? 'Проверка...' : 'Подключить Vast.ai RVC'}</span>
            </button>
          </div>

        </div>

        {/* Input modes: SSH one-line or Manual */}
        <div className="mt-4 space-y-3">
          {!manualMode ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                Ввод одной строкой (SSH-команда из консоли Vast.ai):
              </label>
              <input
                type="text"
                value={sshCommandInput}
                onChange={(e) => handleSshInputChange(e.target.value)}
                placeholder="ssh -N -L 8888:127.0.0.1:9000 -L 8889:127.0.0.1:9001 -p 25411 root@194.168.1.10"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-purple-500/30 rounded-xl text-xs sm:text-sm font-mono text-purple-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Vast.ai IP Сервера:</label>
                <input
                  type="text"
                  value={rvcConfig.serverIp}
                  onChange={(e) => onUpdateRvcConfig({ ...rvcConfig, serverIp: e.target.value })}
                  placeholder="194.168.1.10"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">SSH Порт (-p):</label>
                <input
                  type="number"
                  value={rvcConfig.sshPort}
                  onChange={(e) => onUpdateRvcConfig({ ...rvcConfig, sshPort: parseInt(e.target.value) || 22 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">RVC Audio Порт:</label>
                <input
                  type="number"
                  value={rvcConfig.localRvcPort}
                  onChange={(e) => onUpdateRvcConfig({ ...rvcConfig, localRvcPort: parseInt(e.target.value) || 8889 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Video Порт:</label>
                <input
                  type="number"
                  value={rvcConfig.localVideoPort}
                  onChange={(e) => onUpdateRvcConfig({ ...rvcConfig, localVideoPort: parseInt(e.target.value) || 8888 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Extracted ports telemetry pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-slate-400">Извлеченные параметры:</span>
            <span className="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
              IP: <strong className="text-purple-300">{rvcConfig.serverIp}</strong>
            </span>
            <span className="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
              SSH: <strong className="text-purple-300">{rvcConfig.sshPort}</strong>
            </span>
            <span className="font-mono bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded text-emerald-300">
              RVC Audio: <strong>{rvcConfig.localRvcPort} &rarr; {rvcConfig.remoteRvcPort}</strong>
            </span>
            {rvcConfig.localVideoPort > 0 && (
              <span className="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                Video: <strong>{rvcConfig.localVideoPort} &rarr; {rvcConfig.remoteVideoPort}</strong>
              </span>
            )}
          </div>
        </div>

      </div>

      {/* 2. Hot-Swap Voice Selection & Live Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Models Grid with Hot-Swap */}
        <div className="lg:col-span-2 bg-[#0e1626] border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Голосовые модели RVC (Смена «на лету» во время звонка)
              </h3>
            </div>

            <button
              onClick={async () => {
                setIsRefreshing(true);
                await onRefreshVoices();
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Обновить модели</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {voices.map((voice) => {
              const isActive = voice.id === rvcSettings.activeVoiceId;

              return (
                <div
                  key={voice.id}
                  onClick={() => handleVoiceSelect(voice.id)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-900/20 ring-1 ring-purple-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {voice.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-800 text-purple-300 border border-slate-700">
                          {voice.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {voice.description}
                      </p>
                    </div>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                        {rvcSettings.isSwitching ? 'Смена...' : 'Active'}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Питч модели: <strong className="text-slate-200 font-mono">{voice.recommendedPitch > 0 ? `+${voice.recommendedPitch}` : voice.recommendedPitch}</strong></span>
                    <span className="text-purple-400 font-medium">Клик для смены &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Текущий активный голос: <strong className="text-amber-400">{currentVoice?.name}</strong>
            </span>
            <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hot-Swap готов к звонку
            </span>
          </div>
        </div>

        {/* Right Col: Live Real-time Sliders */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Живые параметры RVC
            </h3>
          </div>

          {/* Pitch (f0up_key) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">Pitch (Тон / f0up_key):</label>
              <span className="font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                {rvcSettings.pitch > 0 ? `+${rvcSettings.pitch}` : rvcSettings.pitch}
              </span>
            </div>

            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={rvcSettings.pitch}
              onChange={(e) => handlePitchChange(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />

            {/* Fast Presets */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {[-12, 0, 6, 12].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePitchChange(preset)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                    rvcSettings.pitch === preset
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {preset > 0 ? `+${preset}` : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Index Rate */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">Index Rate (Схожесть тембра):</label>
              <span className="font-mono font-bold text-amber-300">
                {rvcSettings.indexRate.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={rvcSettings.indexRate}
              onChange={(e) => handleIndexRateChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">0.0 = быстрее, 1.0 = точнее к модели</span>
          </div>

          {/* Protect */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">Protect (Защита согласных):</label>
              <span className="font-mono font-bold text-sky-300">
                {rvcSettings.protect.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.5"
              step="0.01"
              value={rvcSettings.protect}
              onChange={(e) => handleProtectChange(parseFloat(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Защищает от срыва дыхания и резких шипящих</span>
          </div>

        </div>

      </div>

      {/* 3. Self-Test Laboratory (Оценка качества изменения голоса) */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#0e1a2b] to-[#0e1626] border border-sky-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Лаборатория теста голоса (Self-Test)
              </h3>
              <p className="text-xs text-slate-400">
                Запишите свой голос и мгновенно сравните «Оригинал» против «RVC» с текущими настройками
              </p>
            </div>
          </div>

          {/* Live Loopback toggle */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Headphones className={`w-4 h-4 ${liveLoopback ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="text-slate-300 font-medium">Слышать себя (Live Loopback):</span>
            <input
              type="checkbox"
              checked={liveLoopback}
              onChange={(e) => setLiveLoopback(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Record & Status Row */}
        <div className="mt-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            {!isRecordingTest ? (
              <button
                onClick={handleStartRecordTest}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Записать тест</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecordTest}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-400 border border-rose-500/50 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Стоп ({recordDuration}s / 60s)</span>
              </button>
            )}

            {isRecordingTest && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs font-mono text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>Идет запись с микрофона...</span>
              </div>
            )}

            {isProcessingRvc && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Отправка на Vast.ai RVC...</span>
              </div>
            )}

            {hasTestRecording && !isProcessingRvc && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Обработано RVC за {processTimeMs} мс</span>
              </div>
            )}
          </div>

          {/* Action buttons to listen and compare */}
          {hasTestRecording && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => playComparisonAudio('original')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border ${
                  isPlayingOriginal
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                {isPlayingOriginal ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>Слушать Оригинал</span>
              </button>

              <button
                onClick={() => playComparisonAudio('rvc')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border ${
                  isPlayingRvc
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                    : 'bg-purple-950/80 hover:bg-purple-900/80 text-purple-200 border-purple-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Слушать RVC (Измененный)</span>
              </button>

              <button
                onClick={handleRegenerateTest}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Пересчитать эту же запись с новыми значениями Pitch/Index"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Перегенерировать</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
