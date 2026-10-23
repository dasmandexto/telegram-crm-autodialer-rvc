import React, { useState } from 'react';
import { 
  History, 
  Search, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PhoneCall, 
  MessageSquare, 
  Calendar, 
  Filter, 
  ExternalLink, 
  Share2, 
  ChevronRight, 
  Volume2, 
  Settings, 
  Copy, 
  Check, 
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Tag,
  FolderTree,
  Image as ImageIcon,
  Mic,
  Video,
  Film,
  Paperclip
} from 'lucide-react';
import { CallHistoryRecord, GoogleSheetsConfig, ClientStatusDefinition, TemplateMediaAttachment } from '../types';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { downloadBlob } from '../services/zipExporter';

interface CallHistoryViewProps {
  history: CallHistoryRecord[];
  onRedialContact: (target: string, name: string) => void;
  sheetsConfig: GoogleSheetsConfig;
  onUpdateSheetsConfig: (cfg: GoogleSheetsConfig) => void;
  onSyncAllToSheets: () => Promise<void>;
  clientStatuses?: ClientStatusDefinition[];
}

export const CallHistoryView: React.FC<CallHistoryViewProps> = ({
  history,
  onRedialContact,
  sheetsConfig,
  onUpdateSheetsConfig,
  onSyncAllToSheets,
  clientStatuses = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'успешно' | 'пропущен' | 'не удалось'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<CallHistoryRecord | null>(null);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Collect unique statuses and groups for filtering
  const allAvailableStatuses = Array.from(
    new Set([
      ...clientStatuses.map((s) => s.label),
      ...history.map((h) => h.clientStatus).filter(Boolean) as string[],
    ])
  );

  const allAvailableGroups = Array.from(
    new Set([
      ...clientStatuses.map((s) => s.group),
      ...history.map((h) => h.clientStatusGroup).filter(Boolean) as string[],
    ])
  );

  // Filter history
  const filteredRecords = history.filter((rec) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTarget = rec.target.toLowerCase().includes(q);
      const matchName = rec.clientName.toLowerCase().includes(q);
      const matchCompany = rec.company?.toLowerCase().includes(q);
      const matchNotes = rec.notes.toLowerCase().includes(q);
      const matchMsg = rec.message.text?.toLowerCase().includes(q);
      const matchStatus = rec.clientStatus?.toLowerCase().includes(q);
      const matchGroup = rec.clientStatusGroup?.toLowerCase().includes(q);
      if (!matchTarget && !matchName && !matchCompany && !matchNotes && !matchMsg && !matchStatus && !matchGroup) {
        return false;
      }
    }

    // Outcome filter
    if (outcomeFilter !== 'all') {
      const normOutcome = rec.outcome.toLowerCase();
      if (outcomeFilter === 'успешно') {
        if (!normOutcome.includes('успех') && !normOutcome.includes('interested') && !normOutcome.includes('scheduled')) {
          return false;
        }
      } else if (outcomeFilter === 'пропущен') {
        if (!normOutcome.includes('пропущен') && !normOutcome.includes('no_answer') && !normOutcome.includes('missed')) {
          return false;
        }
      } else if (outcomeFilter === 'не удалось') {
        if (!normOutcome.includes('не удалось') && !normOutcome.includes('busy') && !normOutcome.includes('сбросил') && !normOutcome.includes('failed')) {
          return false;
        }
      }
    }

    // Status / Group filter
    if (statusFilter !== 'all') {
      const matchStatus = rec.clientStatus?.toLowerCase() === statusFilter.toLowerCase();
      const matchGroup = rec.clientStatusGroup?.toLowerCase() === statusFilter.toLowerCase();
      if (!matchStatus && !matchGroup) {
        return false;
      }
    }

    return true;
  });

  // Export to Google Sheets CSV
  const handleExportCSV = (specificGroupOrStatus?: string) => {
    const filterKey = specificGroupOrStatus && specificGroupOrStatus !== 'all' ? specificGroupOrStatus : undefined;
    const csvData = GoogleSheetsService.generateCSV(history, filterKey);
    const suffix = filterKey ? `_${filterKey.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '_')}` : '_all';
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `teledial_gsheet_export${suffix}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Sync to Google Sheets
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMessage(null);
    try {
      await onSyncAllToSheets();
      setSyncSuccessMessage(`Синхронизировано ${history.length} записей с Google Таблицей!`);
    } catch {
      setSyncSuccessMessage('Ошибка синхронизации');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncSuccessMessage(null), 4000);
    }
  };

  const copyAppsScript = () => {
    navigator.clipboard.writeText(GoogleSheetsService.getAppsScriptTemplate());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m}м ` : ''}${s}с`;
  };

  // Client Status color styling
  const getStatusBadgeStyle = (color?: string) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-950/50 text-amber-300 border-amber-500/40';
      case 'rose':
        return 'bg-rose-950/50 text-rose-300 border-rose-500/40';
      case 'slate':
        return 'bg-slate-800/80 text-slate-300 border-slate-600/50';
      case 'purple':
        return 'bg-purple-950/50 text-purple-300 border-purple-500/40';
      case 'emerald':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40';
      case 'sky':
        return 'bg-sky-950/50 text-sky-300 border-sky-500/40';
      case 'orange':
        return 'bg-orange-950/50 text-orange-300 border-orange-500/40';
      case 'indigo':
        return 'bg-indigo-950/50 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-sky-950/50 text-sky-300 border-sky-500/40';
    }
  };

  // Outcome styling badge
  const renderOutcomeBadge = (outcome: string) => {
    const norm = outcome.toLowerCase();
    if (norm.includes('успех') || norm.includes('interested') || norm.includes('scheduled')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Успешно
        </span>
      );
    }
    if (norm.includes('пропущен') || norm.includes('no_answer') || norm.includes('missed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
          <Clock className="w-3 h-3 text-amber-400" />
          Пропущен
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/60">
        <XCircle className="w-3 h-3 text-rose-400" />
        Не удалось
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Google Sheets sync status */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
          
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-sky-600/20 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  История и журнал звонков
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-sky-400 border border-slate-700 font-mono">
                  {history.length} записей
                </span>
                {sheetsConfig.autoSyncOnCallFinish && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Синхронизация с Google Таблицей активна
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Полный архив совершенных вызовов, результатов, заметок и отправленных сообщений с автодополнением в Google Таблицу.
              </p>
            </div>
          </div>

          {/* Google Sheets Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowSheetsModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Настройка интеграции с Google Таблицами"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Таблица</span>
            </button>

            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Дополнить базу Google Таблицы новыми звонками"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Синхронизация...' : 'Дополнить базу'}</span>
            </button>

            <button
              onClick={() => handleExportCSV()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              title="Сгенерировать и скачать Google Таблицу"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Сгенерировать Google Таблицу</span>
            </button>
          </div>

        </div>

        {/* Sync notification message */}
        {syncSuccessMessage && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessMessage}</span>
          </div>
        )}

        {/* Summary metrics strip */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400">Всего в истории:</span>
            <p className="text-base font-bold text-white font-mono">{history.length}</p>
          </div>
          <div>
            <span className="text-slate-400">Успешных звонков:</span>
            <p className="text-base font-bold text-emerald-400 font-mono">
              {history.filter((h) => h.outcome.toLowerCase().includes('успех') || h.outcome.toLowerCase().includes('interested') || h.outcome.toLowerCase().includes('scheduled')).length}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Сообщений отправлено:</span>
            <p className="text-base font-bold text-sky-400 font-mono">
              {history.filter((h) => h.message.sent).length}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Google Sheets статус:</span>
            <p className="text-xs font-semibold text-slate-300 truncate">
              {sheetsConfig.sheetName} ({history.filter(h => h.syncedToGoogleSheets).length} в базе)
            </p>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по телефону, @юзернейму, имени, заметкам..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Outcome filters */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setOutcomeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              outcomeFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Все ({history.length})
          </button>
          <button
            onClick={() => setOutcomeFilter('успешно')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              outcomeFilter === 'успешно' ? 'bg-slate-800 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Успешно
          </button>
          <button
            onClick={() => setOutcomeFilter('пропущен')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              outcomeFilter === 'пропущен' ? 'bg-slate-800 text-amber-300 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Пропущен
          </button>
          <button
            onClick={() => setOutcomeFilter('не удалось')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              outcomeFilter === 'не удалось' ? 'bg-slate-800 text-rose-300 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Не удалось
          </button>
        </div>
      </div>

      {/* Client Status & Group Filter Strip (Google Sheets segment selector) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0 mr-1">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            Сегмент (GSheet):
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium border transition-colors shrink-0 ${
              statusFilter === 'all'
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Все статусы ({history.length})
          </button>
          {allAvailableStatuses.map((st) => {
            const count = history.filter((h) => h.clientStatus === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium border transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{st}</span>
                <span className={`px-1 py-0.2 rounded text-[10px] font-mono ${isSelected ? 'bg-amber-800 text-white' : 'bg-slate-900 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Targeted Export of selected status */}
        {statusFilter !== 'all' && (
          <button
            onClick={() => handleExportCSV(statusFilter)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
            title={`Выгрузить в CSV только клиентов со статусом "${statusFilter}"`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Выгрузить сегмент «{statusFilter}» ({filteredRecords.length})</span>
          </button>
        )}
      </div>

      {/* Main Table View */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredRecords.length === 0 ? (
          <div className="py-16 px-4 text-center text-slate-500">
            <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-slate-300">История звонков пуста или ничего не найдено</p>
            <p className="text-xs text-slate-500 mt-1">Попробуйте изменить параметры поиска или совершить новый звонок</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Дата и время</th>
                  <th className="py-3 px-4">Клиент (Телефон / Telegram)</th>
                  <th className="py-3 px-4">Статус / Группа (GSheet)</th>
                  <th className="py-3 px-4">Результат</th>
                  <th className="py-3 px-4">Длительность</th>
                  <th className="py-3 px-4">Комментарий к звонку</th>
                  <th className="py-3 px-4">Отправленное сообщение</th>
                  <th className="py-3 px-4 text-center">В Google Sheets</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRecords.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="hover:bg-slate-850/60 cursor-pointer transition-colors group"
                  >
                    {/* 1. Date & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.dateTime}</span>
                      </div>
                    </td>

                    {/* 2. Client */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{item.clientName || item.target}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <span>{item.target}</span>
                        {item.company && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-500 font-sans">{item.company}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 3. Client Status & Group (Google Sheets Tag) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.clientStatus ? (
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusBadgeStyle(item.clientStatusColor)}`}>
                            <Tag className="w-3 h-3 shrink-0" />
                            {item.clientStatus}
                          </span>
                          {item.clientStatusGroup && (
                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                              <FolderTree className="w-2.5 h-2.5 opacity-60" />
                              <span>{item.clientStatusGroup}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* 4. Outcome */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderOutcomeBadge(item.outcome)}
                    </td>

                    {/* 5. Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300 text-xs">
                      {item.durationSeconds > 0 ? formatDuration(item.durationSeconds) : '—'}
                    </td>

                    {/* 6. Notes / Comment */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-slate-300 truncate" title={item.notes}>
                        {item.notes ? `«${item.notes}»` : <span className="text-slate-600">—</span>}
                      </p>
                    </td>

                    {/* 7. Sent Message Info */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {item.message.sent ? (
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-md">
                              <MessageSquare className="w-3 h-3 text-sky-400 shrink-0" />
                              Отправлено
                            </span>
                            {item.message.mediaAttachment && item.message.mediaAttachment.type !== 'none' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-700/60 px-1.5 py-0.5 rounded">
                                {item.message.mediaAttachment.type === 'image' && <ImageIcon className="w-2.5 h-2.5 text-amber-400" />}
                                {item.message.mediaAttachment.type === 'audio' && <Mic className="w-2.5 h-2.5 text-amber-400" />}
                                {item.message.mediaAttachment.type === 'video' && <Video className="w-2.5 h-2.5 text-amber-400" />}
                                {item.message.mediaAttachment.type === 'gif' && <Film className="w-2.5 h-2.5 text-amber-400" />}
                                <span>{item.message.mediaAttachment.type.toUpperCase()}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 truncate" title={item.message.text}>
                            {item.message.text}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Не отправлялось</span>
                      )}
                    </td>

                    {/* 7. Google Sheets sync badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.syncedToGoogleSheets ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-medium" title="Запись внесена в Google Таблицу">
                          <Check className="w-3.5 h-3.5" />
                          Синхронизировано
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">В очереди</span>
                      )}
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onRedialContact(item.target, item.clientName)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition-all active:scale-95"
                          title="Позвонить повторно"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span className="hidden sm:inline">Позвонить</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Details Drawer Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Детали звонка</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-slate-700"
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Клиент:</span>
                  <span className="text-sm font-bold text-white">{selectedRecord.clientName}</span>
                  <span className="text-slate-400 font-mono block mt-0.5">{selectedRecord.target}</span>
                </div>
                <div>
                  {renderOutcomeBadge(selectedRecord.outcome)}
                </div>
              </div>

              {/* Client Status & Group (Google Sheets Tag) */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1 font-semibold uppercase">Статус / Группа (GSheet):</span>
                  {selectedRecord.clientStatus ? (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusBadgeStyle(selectedRecord.clientStatusColor)}`}>
                        <Tag className="w-3 h-3" />
                        {selectedRecord.clientStatus}
                      </span>
                      {selectedRecord.clientStatusGroup && (
                        <span className="text-slate-400 text-xs">
                          Группа: <strong>{selectedRecord.clientStatusGroup}</strong>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Статус не был назначен</span>
                  )}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Колонки E & F</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Дата и время:</span>
                  <span className="font-mono text-slate-200">{selectedRecord.dateTime}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Длительность:</span>
                  <span className="font-mono text-slate-200">{formatDuration(selectedRecord.durationSeconds)}</span>
                </div>
              </div>

              {/* Comment */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold uppercase">Комментарий менеджера:</span>
                <p className="text-slate-200 text-xs italic">
                  {selectedRecord.notes || 'Комментарий не был указан.'}
                </p>
              </div>

              {/* Message Sent details */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase">Отправленное сообщение в Telegram:</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedRecord.message.sent ? 'Доставлено клиенту' : 'Не отправлялось'}
                  </span>
                </div>
                {selectedRecord.message.sent ? (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 space-y-2">
                    {selectedRecord.message.templateTitle && (
                      <span className="text-[10px] text-emerald-400 block font-semibold">
                        Шаблон: {selectedRecord.message.templateTitle}
                      </span>
                    )}
                    <p className="text-xs whitespace-pre-line">{selectedRecord.message.text}</p>

                    {/* Attached Media Preview */}
                    {selectedRecord.message.mediaAttachment && selectedRecord.message.mediaAttachment.type !== 'none' && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 mb-1.5">
                          <Paperclip className="w-3 h-3" />
                          <span>Прикрепленный файл ({selectedRecord.message.mediaAttachment.type.toUpperCase()}): {selectedRecord.message.mediaAttachment.name}</span>
                        </div>

                        {selectedRecord.message.mediaAttachment.type === 'image' && (
                          <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48 bg-slate-900 flex items-center justify-center">
                            <img 
                              src={selectedRecord.message.mediaAttachment.url} 
                              alt={selectedRecord.message.mediaAttachment.name}
                              className="max-h-48 object-contain"
                            />
                          </div>
                        )}

                        {selectedRecord.message.mediaAttachment.type === 'gif' && (
                          <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48 bg-slate-900 flex items-center justify-center">
                            <img 
                              src={selectedRecord.message.mediaAttachment.url} 
                              alt={selectedRecord.message.mediaAttachment.name}
                              className="max-h-48 object-contain"
                            />
                          </div>
                        )}

                        {selectedRecord.message.mediaAttachment.type === 'audio' && (
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <audio 
                              controls 
                              src={selectedRecord.message.mediaAttachment.url}
                              className="w-full h-8"
                            />
                          </div>
                        )}

                        {selectedRecord.message.mediaAttachment.type === 'video' && (
                          <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48 bg-slate-900">
                            <video 
                              controls 
                              src={selectedRecord.message.mediaAttachment.url}
                              className="w-full max-h-48"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Сообщение после звонка не отправлялось.</p>
                )}
              </div>

              {/* Account and Google Sheets info */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Звонок через: <strong className="text-slate-200">{selectedRecord.accountUsed}</strong></span>
                <span className="text-emerald-400 font-medium">Синхронизировано в Google Sheets</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => {
                  onRedialContact(selectedRecord.target, selectedRecord.clientName);
                  setSelectedRecord(null);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Перезвонить клиенту прямо сейчас</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Google Sheets Integration & Live Sync Modal */}
      {showSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Интеграция с Google Таблицами
                  </h3>
                  <p className="text-xs text-slate-400">
                    Автоматическая выгрузка и пополнение базы позвонивших лидов
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSheetsModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Connected Spreadsheet URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ссылка на вашу Google Таблицу (для быстрого перехода):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sheetsConfig.spreadsheetUrl}
                    onChange={(e) => onUpdateSheetsConfig({ ...sheetsConfig, spreadsheetUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <a
                    href={sheetsConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Открыть</span>
                  </a>
                </div>
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Автоматически дополнять базу в Google Sheets
                  </span>
                  <span className="text-[11px] text-slate-400">
                    После каждого завершенного звонка строка автоматически добавляется в таблицу
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={sheetsConfig.autoSyncOnCallFinish}
                  onChange={(e) => onUpdateSheetsConfig({ ...sheetsConfig, autoSyncOnCallFinish: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Webhook URL for Google Apps Script */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Webhook URL Google Apps Script (для живого добавления строк):
                </label>
                <input
                  type="text"
                  value={sheetsConfig.webhookUrl}
                  onChange={(e) => onUpdateSheetsConfig({ ...sheetsConfig, webhookUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec (опционально)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Google Apps Script code snippet generator */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Готовый код Google Apps Script (для вашей таблицы):
                  </span>
                  <button
                    onClick={copyAppsScript}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Скопировано!' : 'Скопировать скрипт'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Инструкция: в Google Таблице откройте <strong>Расширения → Apps Script</strong>, вставьте этот скрипт и нажмите <strong>Развернуть → Новое развертывание → Веб-приложение</strong>. Скопируйте полученный URL в поле Webhook выше.
                </p>
                <pre className="p-2.5 bg-slate-900 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto max-h-24">
                  {GoogleSheetsService.getAppsScriptTemplate().slice(0, 320)}...
                </pre>
              </div>

            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleExportCSV()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Скачать CSV для Google Таблицы</span>
              </button>

              <button
                onClick={() => setShowSheetsModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Готово
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
