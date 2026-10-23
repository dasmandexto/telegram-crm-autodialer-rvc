import React from 'react';
import { PhoneCall, Calendar, Users, Bell, History, Sparkles, FileAudio } from 'lucide-react';
import { AppTab } from '../types';

interface MobileNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  unreadInboxCount: number;
  recordingsCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  unreadInboxCount,
  recordingsCount,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e1626]/95 backdrop-blur-lg border-t border-slate-800/80 pb-safe">
      <div className="grid grid-cols-7 items-center h-16 px-0.5">
        
        {/* Queue */}
        <button
          onClick={() => setActiveTab('queue')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'queue' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span className="text-[8px] mt-1 tracking-tight">Звонки</span>
        </button>

        {/* RVC */}
        <button
          onClick={() => setActiveTab('rvc_studio')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'rvc_studio' ? 'text-purple-400 font-semibold' : 'text-slate-400 hover:text-purple-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[8px] mt-1 tracking-tight">RVC</span>
        </button>

        {/* Recordings */}
        <button
          onClick={() => setActiveTab('recordings')}
          className={`relative min-h-[48px] flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'recordings' ? 'text-rose-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileAudio className="w-4 h-4" />
          <span className="text-[8px] mt-1 tracking-tight">Записи</span>
          {recordingsCount > 0 && (
            <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-slate-700 text-slate-200 text-[8px] font-bold flex items-center justify-center">
              {recordingsCount}
            </span>
          )}
        </button>

        {/* History */}
        <button
          onClick={() => setActiveTab('history')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'history' ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-[8px] mt-1 tracking-tight">История</span>
        </button>

        {/* Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'calendar' ? 'text-teal-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[8px] mt-1 tracking-tight">Календарь</span>
        </button>

        {/* Accounts */}
        <button
          onClick={() => setActiveTab('accounts')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'accounts' ? 'text-purple-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[8px] mt-1 tracking-tight">Аккаунты</span>
        </button>

        {/* Inbox */}
        <button
          onClick={() => setActiveTab('inbox')}
          className={`relative min-h-[48px] flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            activeTab === 'inbox' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span className="text-[8px] mt-1 tracking-tight">Инбокс</span>
          {unreadInboxCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[8px] font-bold flex items-center justify-center">
              {unreadInboxCount}
            </span>
          )}
        </button>

      </div>
    </div>
  );
};
