import React, { useState } from 'react';
import { 
  Bell, 
  MessageSquare, 
  PhoneMissed, 
  PhoneCall, 
  CheckCheck, 
  Clock, 
  Send,
  PlusCircle,
  Filter
} from 'lucide-react';
import { InboxEvent } from '../types';

interface InboxDrawerProps {
  events: InboxEvent[];
  onMarkRead: (id: string) => void;
  onCallClient: (target: string, name: string) => void;
  onReplyMessage: (target: string, account: string) => void;
  onAddMockEvent: () => void;
}

export const InboxDrawer: React.FC<InboxDrawerProps> = ({
  events,
  onMarkRead,
  onCallClient,
  onReplyMessage,
  onAddMockEvent,
}) => {
  const [filter, setFilter] = useState<'all' | 'message' | 'missed_call'>('all');

  const filteredEvents = events.filter((ev) => {
    if (filter === 'all') return true;
    return ev.type === filter;
  });

  const unreadCount = events.filter((e) => !e.read).length;

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Входящие события (Инбокс)
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 font-mono">
                  {unreadCount} новых
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Пропущенные звонки и ответы в Telegram от клиентов из базы
            </p>
          </div>
        </div>

        {/* Filter buttons & test trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Все ({events.length})
            </button>
            <button
              onClick={() => setFilter('message')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'message' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Сообщения
            </button>
            <button
              onClick={() => setFilter('missed_call')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'missed_call' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Пропущенные
            </button>
          </div>

          <button
            onClick={onAddMockEvent}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Смоделировать входящий ответ от клиента"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Тест входящего</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Нет входящих событий в данной категории</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredEvents.map((ev) => {
              const isMessage = ev.type === 'message';

              return (
                <div
                  key={ev.id}
                  onClick={() => !ev.read && onMarkRead(ev.id)}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors ${
                    !ev.read ? 'bg-slate-900/90 border-l-4 border-amber-400' : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Left: Icon & Exact Format Title */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                        isMessage
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                          : 'bg-rose-950/60 border border-rose-500/40 text-rose-400'
                      }`}
                    >
                      {isMessage ? <MessageSquare className="w-5 h-5" /> : <PhoneMissed className="w-5 h-5" />}
                    </div>

                    <div>
                      {/* Exact Format Requirement: "Сообщение от [Клиент] на аккаунт [Наш Аккаунт]" */}
                      <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                        {isMessage ? (
                          <span>
                            Сообщение от <span className="text-emerald-400 font-mono">{ev.client}</span> на аккаунт <span className="text-slate-300 font-mono">{ev.account}</span>
                          </span>
                        ) : (
                          <span>
                            Пропущенный звонок от <span className="text-rose-400 font-mono">{ev.client}</span> на аккаунт <span className="text-slate-300 font-mono">{ev.account}</span>
                          </span>
                        )}

                        {!ev.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        )}
                      </div>

                      {/* Subtitle with client name and timestamp */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{ev.clientName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-mono text-slate-500">
                          <Clock className="w-3 h-3" />
                          {ev.timestamp}
                        </span>
                      </div>

                      {/* Message preview snippet */}
                      {ev.previewText && (
                        <div className="mt-2 text-xs text-slate-300 bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 max-w-xl">
                          «{ev.previewText}»
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Redial / Reply */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCallClient(ev.client, ev.clientName);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow active:scale-95 transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Перезвонить</span>
                    </button>

                    {isMessage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReplyMessage(ev.client, ev.account);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3 h-3 text-emerald-400" />
                        <span>Ответить</span>
                      </button>
                    )}
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
