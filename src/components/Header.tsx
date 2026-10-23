import React from 'react';
import { 
  PhoneCall, 
  Calendar, 
  Users, 
  Bell, 
  Download, 
  ShieldCheck, 
  History,
  Sparkles,
  FileAudio,
  Cpu
} from 'lucide-react';
import { TelegramAccount, AppTab, RvcConnectionConfig } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  unreadInboxCount: number;
  historyCount: number;
  recordingsCount: number;
  activeAccount: TelegramAccount | null;
  rvcConfig?: RvcConnectionConfig;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadInboxCount,
  historyCount,
  recordingsCount,
  activeAccount,
  rvcConfig,
  onOpenExportModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0e1626]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-6">
        
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                TeleDial <span className="text-emerald-400 font-semibold">CRM</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Telegram VoIP
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Холодные звонки · RVC Голос · Рекордер</p>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'queue'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            Очередь
          </button>

          <button
            onClick={() => setActiveTab('rvc_studio')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rvc_studio'
                ? 'bg-purple-950/80 text-purple-200 font-semibold shadow-sm border border-purple-800/60'
                : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/30'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            RVC Студия
          </button>

          <button
            onClick={() => setActiveTab('recordings')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'recordings'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <FileAudio className="w-4 h-4 text-rose-400" />
            Записи
            {recordingsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-slate-700 text-slate-200 rounded-full tabular-nums">
                {recordingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <History className="w-4 h-4 text-sky-400" />
            История
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-slate-700 text-slate-200 rounded-full tabular-nums">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Calendar className="w-4 h-4 text-teal-400" />
            Календарь
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            Аккаунты
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`relative px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'inbox'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            Инбокс
            {unreadInboxCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full tabular-nums">
                {unreadInboxCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: RVC Status Indicator & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* RVC Vast.ai Server Status Indicator */}
          <button
            onClick={() => setActiveTab('rvc_studio')}
            title="Перейти к управлению Vast.ai RVC"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium transition-all ${
              rvcConfig?.status === 'online'
                ? 'bg-purple-950/60 border-purple-800/60 text-purple-300 hover:bg-purple-900/60'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              rvcConfig?.status === 'online' ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'
            }`}></span>
            <span>RVC:</span>
            <span className={rvcConfig?.status === 'online' ? 'font-bold text-purple-300' : 'text-slate-400'}>
              {rvcConfig?.status === 'online' ? `Online (${rvcConfig.pingMs}ms)` : 'Offline'}
            </span>
          </button>

          {activeAccount && (
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Аккаунт:</span>
              <span className="font-medium text-slate-200">{activeAccount.username}</span>
              <span className="text-slate-500">({activeAccount.callsToday}/{activeAccount.dailyCallLimit})</span>
            </div>
          )}

          <button
            onClick={onOpenExportModal}
            title="Скачать ZIP архив с кодом для бэкенда"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700/80 rounded-lg transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Скачать ZIP проект</span>
            <span className="sm:hidden">ZIP</span>
          </button>
        </div>

      </div>
    </header>
  );
};
