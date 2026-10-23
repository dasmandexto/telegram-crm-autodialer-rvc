import React, { useState } from 'react';
import { 
  Users, 
  UploadCloud, 
  ShieldCheck, 
  Settings2, 
  FileCheck, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Server,
  Info,
  Network,
  RefreshCw,
  Plus,
  Activity,
  Globe,
  Tag,
  FolderTree,
  Check,
  Edit3,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  Sparkles,
  X,
  MessageSquare,
  Dices,
  Image as ImageIcon,
  Mic,
  Video,
  Film,
  Paperclip
} from 'lucide-react';
import { TelegramAccount, CRMSettings, ProxyServer, ClientStatusDefinition, MessageTemplate, TemplateMediaType } from '../types';
import { DEFAULT_CLIENT_STATUSES } from '../services/storage';
import { SpintaxService } from '../services/spintax';

interface AccountsSettingsProps {
  accounts: TelegramAccount[];
  activeAccount: TelegramAccount | null;
  onSetActiveAccount: (acc: TelegramAccount) => void;
  onUploadAccountFile: (file: File, dailyLimit: number) => Promise<void>;
  onDeleteAccount: (id: string) => void;
  settings: CRMSettings;
  onUpdateSettings: (settings: CRMSettings) => void;
  templates?: MessageTemplate[];
  onOpenNewTemplateModal?: () => void;
  onDeleteTemplate?: (id: string) => void;
}

export const AccountsSettings: React.FC<AccountsSettingsProps> = ({
  accounts,
  activeAccount,
  onSetActiveAccount,
  onUploadAccountFile,
  onDeleteAccount,
  settings,
  onUpdateSettings,
  templates = [],
  onOpenNewTemplateModal,
  onDeleteTemplate,
}) => {
  const [activeSettingsSection, setActiveSettingsSection] = useState<'accounts_proxies' | 'client_statuses' | 'message_templates'>('accounts_proxies');
  const [templateSpunSamples, setTemplateSpunSamples] = useState<Record<string, string>>({});
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // New proxy form states
  const [showAddProxy, setShowAddProxy] = useState<boolean>(false);
  const [newProxyUrl, setNewProxyUrl] = useState<string>('');
  const [newProxyLabel, setNewProxyLabel] = useState<string>('');
  const [newProxyCountry, setNewProxyCountry] = useState<string>('DE');
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);

  // Client Status Management states
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<string>('');
  const [statusGroup, setStatusGroup] = useState<string>('Отказ (с шансом)');
  const [statusColor, setStatusColor] = useState<string>('amber');
  const [statusDesc, setStatusDesc] = useState<string>('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [statusActionFeedback, setStatusActionFeedback] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const processFiles = async (files: FileList) => {
    setIsUploading(true);
    setUploadMessage(null);
    try {
      for (let i = 0; i < files.length; i++) {
        await onUploadAccountFile(files[i], settings.dailyCallLimitPerAccount);
      }
      setUploadMessage(`Успешно загружено и авторизовано файлов: ${files.length}`);
    } catch {
      setUploadMessage('Ошибка при обработке файлов сессий');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLimitChange = (val: number) => {
    const updated = { ...settings, dailyCallLimitPerAccount: Math.max(1, val) };
    onUpdateSettings(updated);
  };

  const handleAddProxy = () => {
    if (!newProxyUrl.trim()) return;
    const cleanUrl = newProxyUrl.trim();
    const newPrx: ProxyServer = {
      id: `prx-${Date.now()}`,
      url: cleanUrl,
      label: newProxyLabel.trim() || `SOCKS5 ${newProxyCountry} (${cleanUrl.split('@')[1] || cleanUrl})`,
      country: newProxyCountry,
      pingMs: Math.floor(Math.random() * 45 + 32),
      status: 'active',
      callsCount: 0,
    };
    const currentList = settings.proxies || [];
    onUpdateSettings({
      ...settings,
      proxies: [...currentList, newPrx],
    });
    setNewProxyUrl('');
    setNewProxyLabel('');
    setShowAddProxy(false);
  };

  const handleDeleteProxy = (id: string) => {
    const currentList = settings.proxies || [];
    if (currentList.length <= 1) {
      alert('У пулі повинен залишатися щонайменше 1 проксі-сервер.');
      return;
    }
    const updated = currentList.filter((p) => p.id !== id);
    onUpdateSettings({
      ...settings,
      proxies: updated,
      currentProxyIndex: 0,
    });
  };

  const handleTestPing = async () => {
    setIsTestingPing(true);
    await new Promise((r) => setTimeout(r, 600));
    const currentList = settings.proxies || [];
    const tested = currentList.map((p) => ({
      ...p,
      pingMs: Math.floor(Math.random() * 35 + 28),
      status: 'active' as const,
    }));
    onUpdateSettings({ ...settings, proxies: tested });
    setIsTestingPing(false);
  };

  const proxies = settings.proxies || [];
  const activeProxyIndex = (settings.currentProxyIndex || 0) % (proxies.length || 1);
  const currentActiveProxy = proxies[activeProxyIndex] || null;
  const nextProxyIndex = (activeProxyIndex + 1) % (proxies.length || 1);
  const nextProxy = proxies[nextProxyIndex] || null;

  const clientStatuses = settings.clientStatuses || DEFAULT_CLIENT_STATUSES;

  // Groups present in current statuses
  const availableGroups = Array.from(new Set(clientStatuses.map((s) => s.group))).filter(Boolean);

  const handleOpenAddStatus = () => {
    setEditingStatusId(null);
    setStatusLabel('');
    setStatusGroup(availableGroups[0] || 'Отказ (с шансом)');
    setStatusColor('amber');
    setStatusDesc('');
    setShowStatusModal(true);
  };

  const handleOpenEditStatus = (st: ClientStatusDefinition) => {
    setEditingStatusId(st.id);
    setStatusLabel(st.label);
    setStatusGroup(st.group);
    setStatusColor(st.color);
    setStatusDesc(st.description || '');
    setShowStatusModal(true);
  };

  const handleSaveStatus = () => {
    if (!statusLabel.trim()) return;
    const cleanLabel = statusLabel.trim();
    const cleanGroup = statusGroup.trim() || 'Общее';

    let updatedList: ClientStatusDefinition[];

    if (editingStatusId) {
      updatedList = clientStatuses.map((s) =>
        s.id === editingStatusId
          ? {
              ...s,
              label: cleanLabel,
              group: cleanGroup,
              color: statusColor,
              description: statusDesc.trim(),
            }
          : s
      );
      setStatusActionFeedback(`Статус «${cleanLabel}» успішно оновлено`);
    } else {
      const newStatus: ClientStatusDefinition = {
        id: `status_${Date.now()}`,
        label: cleanLabel,
        group: cleanGroup,
        color: statusColor,
        description: statusDesc.trim(),
        isDefault: false,
      };
      updatedList = [...clientStatuses, newStatus];
      setStatusActionFeedback(`Створено новий статус «${cleanLabel}» в групі [${cleanGroup}]`);
    }

    onUpdateSettings({
      ...settings,
      clientStatuses: updatedList,
    });

    setShowStatusModal(false);
    setTimeout(() => setStatusActionFeedback(null), 3500);
  };

  const handleDeleteStatus = (id: string) => {
    if (clientStatuses.length <= 1) {
      alert('У системі повинен залишатися щонайменше 1 статус.');
      return;
    }
    const target = clientStatuses.find((s) => s.id === id);
    const updatedList = clientStatuses.filter((s) => s.id !== id);
    onUpdateSettings({
      ...settings,
      clientStatuses: updatedList,
    });
    setStatusActionFeedback(`Статус «${target?.label || id}» видалено`);
    setTimeout(() => setStatusActionFeedback(null), 3000);
  };

  const handleResetToDefaultStatuses = () => {
    onUpdateSettings({
      ...settings,
      clientStatuses: DEFAULT_CLIENT_STATUSES,
    });
    setStatusActionFeedback('Відновлено рекомендований набір статусів («відмовився але на контакт йде», «істеричка», «не відповів», «закриті налаштування»...)');
    setTimeout(() => setStatusActionFeedback(null), 4000);
  };

  const getStatusColorClasses = (color: string) => {
    switch (color) {
      case 'amber':
        return { badge: 'bg-amber-950/40 text-amber-300 border-amber-500/40', dot: 'bg-amber-400' };
      case 'rose':
        return { badge: 'bg-rose-950/40 text-rose-300 border-rose-500/40', dot: 'bg-rose-400' };
      case 'slate':
        return { badge: 'bg-slate-800/60 text-slate-300 border-slate-600', dot: 'bg-slate-400' };
      case 'purple':
        return { badge: 'bg-purple-950/40 text-purple-300 border-purple-500/40', dot: 'bg-purple-400' };
      case 'emerald':
        return { badge: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400' };
      case 'sky':
        return { badge: 'bg-sky-950/40 text-sky-300 border-sky-500/40', dot: 'bg-sky-400' };
      case 'orange':
        return { badge: 'bg-orange-950/40 text-orange-300 border-orange-500/40', dot: 'bg-orange-400' };
      case 'indigo':
        return { badge: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/40', dot: 'bg-indigo-400' };
      default:
        return { badge: 'bg-sky-950/40 text-sky-300 border-sky-500/40', dot: 'bg-sky-400' };
    }
  };

  const filteredClientStatuses = selectedGroupFilter === 'all'
    ? clientStatuses
    : clientStatuses.filter((s) => s.group === selectedGroupFilter);

  return (
    <div className="space-y-6">
      
      {/* Subtab Navigator */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSettingsSection('accounts_proxies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSettingsSection === 'accounts_proxies'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Telegram & Проксі по колу</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-200 border border-purple-500/30">
              {accounts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSettingsSection('client_statuses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSettingsSection === 'client_statuses'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Статуси та групи клієнтів (Google Sheets)</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-200 border border-amber-500/30">
              {clientStatuses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSettingsSection('message_templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSettingsSection === 'message_templates'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Шаблони, Спинтакс & Медіа</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-200 border border-emerald-500/30">
              {templates.length}
            </span>
          </button>
        </div>

        {statusActionFeedback && (
          <div className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{statusActionFeedback}</span>
          </div>
        )}
      </div>

      {activeSettingsSection === 'client_statuses' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Client Statuses Manager Card */}
          <div className="bg-[#0e1626] border border-amber-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-950/20">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Конфігурація статусів та груп клієнтів
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      {clientStatuses.length} статусів / {availableGroups.length} груп
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Призначаються кожному набраному номеру/юзернейму після дзвінка та записуються в Google Таблицю для фільтрації та сегментації баз
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetToDefaultStatuses}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                  title="Відновити рекомендовані статуси: відмовився але на контакт йде, істеричка, не відповів, закриті налаштування..."
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Відновити рекомендовані</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddStatus}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Додати статус / тег</span>
                </button>
              </div>

            </div>

            {/* Group Filter Chips */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                Фільтр за групою:
              </span>
              <button
                type="button"
                onClick={() => setSelectedGroupFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  selectedGroupFilter === 'all'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Всі групи ({clientStatuses.length})
              </button>
              {availableGroups.map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroupFilter(grp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    selectedGroupFilter === grp
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {grp} ({clientStatuses.filter((s) => s.group === grp).length})
                </button>
              ))}
            </div>

            {/* List of Statuses */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredClientStatuses.map((st) => {
                const colorCls = getStatusColorClasses(st.color);
                return (
                  <div
                    key={st.id}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorCls.dot}`}></span>
                          <span className="text-sm font-bold text-white tracking-tight">
                            {st.label}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorCls.badge}`}>
                          {st.group}
                        </span>
                      </div>

                      {st.description && (
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {st.description}
                        </p>
                      )}

                      {/* Google Sheets preview indicator */}
                      <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Колонка GSheet:</span>
                        <strong className="text-slate-200">«{st.label}»</strong>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400">«{st.group}»</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStatus(st)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Редагувати</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStatus(st.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Видалити статус"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick explanation */}
            <div className="mt-5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Принцип вивантаження в Google Sheets:</strong> Після кожного дзвінка обраний статус і група автоматично відправляються в Google Таблицю через Webhook або CSV-експорт. У самій таблиці ви можете створити зведену таблицю (Pivot Table) або застосувати стандартний фільтр за колонкою <em>«Статус клієнта / Тег»</em> або <em>«Группа статусу»</em> для роботи з базою по сегментам (наприклад, окремо продзвонити всіх з міткою <em>«відмовився але на контакт йде»</em>).
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CLIENT STATUS */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0f172a] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingStatusId ? 'Редагувати статус клієнта' : 'Створити новий статус клієнта'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Назва статусу (Тег)
                </label>
                <input
                  type="text"
                  value={statusLabel}
                  onChange={(e) => setStatusLabel(e.target.value)}
                  placeholder="Наприклад: відмовився але на контакт йде / істеричка / не відповів"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Група / Категорія для вивантаження
                </label>
                <input
                  type="text"
                  value={statusGroup}
                  onChange={(e) => setStatusGroup(e.target.value)}
                  placeholder="Наприклад: Отказ (с шансом) / Сложные клиенты / Приватность"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                {/* Preset quick group chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-500">Швидкі групи:</span>
                  {['Отказ (с шансом)', 'Сложные клиенты', 'Недозвон', 'Приватность', 'Горячие', 'Встречи', 'Невалидные'].map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setStatusGroup(grp)}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Колір бейджа
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[
                    { id: 'amber', label: 'Бурштин', bg: 'bg-amber-500' },
                    { id: 'rose', label: 'Червоний', bg: 'bg-rose-500' },
                    { id: 'slate', label: 'Сірий', bg: 'bg-slate-400' },
                    { id: 'purple', label: 'Фіолетовий', bg: 'bg-purple-500' },
                    { id: 'emerald', label: 'Зелений', bg: 'bg-emerald-500' },
                    { id: 'sky', label: 'Блакитний', bg: 'bg-sky-500' },
                    { id: 'orange', label: 'Помаранчевий', bg: 'bg-orange-500' },
                    { id: 'indigo', label: 'Індиго', bg: 'bg-indigo-500' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setStatusColor(c.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        statusColor === c.id
                          ? 'border-white bg-slate-800 ring-2 ring-amber-400/50'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bg}`}></span>
                      <span className="text-[9px] text-slate-300">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Опис / Підказка оператору
                </label>
                <textarea
                  rows={2}
                  value={statusDesc}
                  onChange={(e) => setStatusDesc(e.target.value)}
                  placeholder="Короткий опис, коли оператор повинен встановлювати цей статус..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={!statusLabel.trim()}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {editingStatusId ? 'Зберегти зміни' : 'Створити статус'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: MESSAGE TEMPLATES, SPINTAX & MEDIA ATTACHMENTS */}
      {activeSettingsSection === 'message_templates' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#0e1626] border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-950/20">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Шаблони повідомлень, Спинтакс & Медіа
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {templates.length} шаблонів
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Повідомлення після дзвінка в Telegram з підтримкою рандомізації тексту {'{варіант1|варіант2}'} та відправкою фото, аудіо-заміток, відеороликів і GIF
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {onOpenNewTemplateModal && (
                  <button
                    type="button"
                    onClick={onOpenNewTemplateModal}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Створити новий шаблон</span>
                  </button>
                )}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => {
                const hasSpin = SpintaxService.hasSpintax(tpl.content);
                const combCount = SpintaxService.countCombinations(tpl.content);
                const spunSample = templateSpunSamples[tpl.id];

                return (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700">
                            {tpl.category}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1.5 tracking-tight">
                            {tpl.title}
                          </h4>
                        </div>

                        {/* Media badge */}
                        {tpl.mediaAttachment && tpl.mediaAttachment.type !== 'none' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-950 text-sky-300 border border-sky-500/40 font-mono shrink-0">
                            {tpl.mediaAttachment.type.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Content Preview */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line">
                        {tpl.content}
                      </div>

                      {/* Media preview block */}
                      {tpl.mediaAttachment && tpl.mediaAttachment.type !== 'none' && (
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                          {tpl.mediaAttachment.type === 'image' && (
                            <img src={tpl.mediaAttachment.url} alt="Медиа" className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          {tpl.mediaAttachment.type === 'gif' && (
                            <img src={tpl.mediaAttachment.url} alt="GIF" className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          {tpl.mediaAttachment.type === 'audio' && (
                            <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                              <Mic className="w-5 h-5" />
                            </div>
                          )}
                          {tpl.mediaAttachment.type === 'video' && (
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                              <Video className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-medium text-slate-200 block truncate">
                              {tpl.mediaAttachment.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Вкладення {tpl.mediaAttachment.type} ({tpl.mediaAttachment.sizeKb || 200} КБ)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Spintax Test output if generated */}
                      {spunSample && (
                        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 animate-fadeIn">
                          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                            Згенерований зразок спинтаксу:
                          </span>
                          <p className="whitespace-pre-line">{spunSample}</p>
                        </div>
                      )}
                    </div>

                    {/* Template Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-2">
                        {hasSpin ? (
                          <button
                            type="button"
                            onClick={() => {
                              const spun = SpintaxService.spin(tpl.content)
                                .replace('{имя}', 'Олексій')
                                .replace('{время}', 'завтра о 14:00')
                                .replace('{id}', '7421');
                              setTemplateSpunSamples((prev) => ({ ...prev, [tpl.id]: spun }));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                            title="Згенерувати випадковий варіант спинтаксу для тесту"
                          >
                            <Dices className="w-3.5 h-3.5" />
                            <span>Тест спинтаксу (~{combCount})</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">Без спинтаксу</span>
                        )}
                      </div>

                      {onDeleteTemplate && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirmDeleteTemplateId === tpl.id) {
                              onDeleteTemplate(tpl.id);
                              setConfirmDeleteTemplateId(null);
                            } else {
                              setConfirmDeleteTemplateId(tpl.id);
                              setTimeout(() => setConfirmDeleteTemplateId(null), 3000);
                            }
                          }}
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                            confirmDeleteTemplateId === tpl.id
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                          }`}
                          title="Видалити шаблон"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {confirmDeleteTemplateId === tpl.id && <span>Підтвердити?</span>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spintax and Media Info Box */}
            <div className="mt-5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Як працює спинтакс та медіа-вкладення:</span>
              </div>
              <p>
                1. <strong>Спинтакс:</strong> використовуйте конструкцію <code className="text-amber-300 font-mono">{'{Привіт|Добрий день|Вітаю}'}</code>. При кожному відправленні повідомлення CRM автоматично обирає один із варіантів, унеможливлюючи виявлення шаблону алгоритмами Telegram Anti-Spam.
              </p>
              <p>
                2. <strong>Медіа:</strong> до будь-якого шаблону можна прикріпити голосову аудіо-замітку (.mp3), відеоролик (.mp4), зображення комерційної пропозиції (.png, .jpg) або анімований стікер (.gif). Вони автоматично підвантажуються у вікні завершення дзвінка для швидкої відправки.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TELEGRAM ACCOUNTS & PROXY ROTATION (Original section) */}
      {activeSettingsSection === 'accounts_proxies' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Info */}
          <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Управління Telegram-акаунтами та Проксі
                </h2>
                <p className="text-xs text-slate-400">
                  Мульти-акаунтний пул з автоматичною ротацією проксі по колу при кожній зміні акаунту
                </p>
              </div>
            </div>

            {/* Global Daily Limit Setting Input */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 flex items-center justify-between gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Ліміт дзвінків з одного акаунту на добу:
            </label>
            <span className="text-[10px] text-slate-500">Безпечний поріг антифлуду: 25-40</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={150}
              value={settings.dailyCallLimitPerAccount}
              onChange={(e) => handleLimitChange(parseInt(e.target.value) || 35)}
              className="w-16 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-center font-mono font-bold text-emerald-400 text-sm focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-slate-400">дзв/день</span>
          </div>
        </div>
      </div>

      {/* PROXY ROTATION SYSTEM (КОЖНА ЗМІНА АКАУНТУ - ЗМІНА ПРОКСІ ПО КОЛУ) */}
      <div className="bg-[#0e1626] border border-sky-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-sky-950/20">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Ротація проксі по колу (Round-Robin)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                  {proxies.length} проксі в пулі
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Кожна зміна акаунту для дзвінків автоматично переключає проксі по круговому циклу
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleTestPing}
              disabled={isTestingPing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Activity className={`w-3.5 h-3.5 text-emerald-400 ${isTestingPing ? 'animate-spin' : ''}`} />
              <span>{isTestingPing ? 'Перевірка...' : 'Перевірити пінг'}</span>
            </button>

            <button
              onClick={() => setShowAddProxy(true)}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Додати проксі</span>
            </button>
          </div>

        </div>

        {/* Current Round-Robin Cycle Status Indicator */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin duration-3000" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">
                Поточний активний проксі в циклі [#{activeProxyIndex + 1} з {proxies.length}]:
              </span>
              <span className="font-bold text-white font-mono text-sm">
                {currentActiveProxy ? currentActiveProxy.label : 'Не налаштовано'}
              </span>
              {nextProxy && proxies.length > 1 && (
                <span className="text-slate-400 ml-2 text-[11px]">
                  (Наступний у колі: <strong className="text-sky-300">{nextProxy.label}</strong>)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-300 font-medium">Ротація при дзвінках:</label>
            <button
              onClick={() => onUpdateSettings({ ...settings, proxyRotationEnabled: !settings.proxyRotationEnabled })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                settings.proxyRotationEnabled
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.proxyRotationEnabled ? 'Увімкнено (по колу)' : 'Вимкнено'}
            </button>
          </div>
        </div>

        {/* Proxies List */}
        <div className="mt-4 divide-y divide-slate-800/80 border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/40">
          {proxies.map((prx, idx) => {
            const isCurrentInCycle = idx === activeProxyIndex;

            return (
              <div
                key={prx.id}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors ${
                  isCurrentInCycle ? 'bg-sky-950/30 border-l-4 border-sky-400' : 'hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500 w-6 text-center">
                    #{idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {prx.label}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {prx.country}
                      </span>
                      {isCurrentInCycle && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Зараз у дзвінку
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-md">
                      {prx.url}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Activity className="w-3.5 h-3.5" />
                    <span>{prx.pingMs} ms</span>
                  </div>

                  <span className="text-slate-400">
                    Викликів: <strong className="text-slate-200">{prx.callsCount}</strong>
                  </span>

                  <button
                    onClick={() => handleDeleteProxy(prx.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Видалити проксі з пулу"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal / Inline Add Proxy Dialog */}
        {showAddProxy && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase">Додати новий проксі-сервер</span>
              <button onClick={() => setShowAddProxy(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-300 mb-1">
                  Проксі рядок (SOCKS5 / HTTP):
                </label>
                <input
                  type="text"
                  value={newProxyUrl}
                  onChange={(e) => setNewProxyUrl(e.target.value)}
                  placeholder="socks5://user:pass@185.122.90.14:1080 або 185.122.90.14:1080"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Країна / Локація:</label>
                <select
                  value={newProxyCountry}
                  onChange={(e) => setNewProxyCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="RU">RU (Росія)</option>
                  <option value="DE">DE (Німеччина)</option>
                  <option value="NL">NL (Нідерланди)</option>
                  <option value="US">US (США)</option>
                  <option value="UA">UA (Україна)</option>
                  <option value="PL">PL (Польща)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddProxy(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Скасувати
              </button>
              <button
                onClick={handleAddProxy}
                disabled={!newProxyUrl.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
              >
                Зберегти проксі
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Drag & Drop Area for session.json and TData */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center transition-all ${
          isDragging
            ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-600 bg-[#0e1626]/60'
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          accept=".json,.session,.zip,application/json"
          id="account-file-upload"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />

        <div className="max-w-md mx-auto space-y-3 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              Зона Drag & Drop для файлів авторизації Telegram
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Перетягніть сюди файли <strong className="text-slate-200">session.json</strong>, <strong className="text-slate-200">.session</strong> або архіви <strong className="text-slate-200">TData</strong>
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 shadow-sm pointer-events-auto cursor-pointer">
              {isUploading ? 'Обробка та валідація...' : 'Обрати файли на комп’ютері'}
            </span>
          </div>

          {uploadMessage && (
            <div className="pt-2 text-xs font-medium text-emerald-400 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{uploadMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Accounts List & Status */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Підключені акаунти ({accounts.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Дзвінки розподіляються рівномірно між активними акаунтами з ротацією проксі
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {accounts.map((acc) => {
            const isSelected = activeAccount?.id === acc.id;
            const percentage = Math.round((acc.callsToday / acc.dailyCallLimit) * 100);
            const isNearLimit = percentage >= 80;

            return (
              <div
                key={acc.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors ${
                  isSelected ? 'bg-emerald-950/20 border-l-4 border-emerald-500' : 'hover:bg-slate-800/20'
                }`}
              >
                {/* Account details */}
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl ${acc.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow`}>
                    {acc.username.slice(1, 3).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {acc.username}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {acc.phone}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Основний
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>{acc.displayName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500 flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        {acc.proxy}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Daily limit progress bar */}
                <div className="w-full md:w-56 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Дзвінків за добу:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {acc.callsToday} / {acc.dailyCallLimit}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  {isNearLimit && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Близько до добового ліміту
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0">
                  {!isSelected ? (
                    <button
                      onClick={() => onSetActiveAccount(acc)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
                    >
                      Зробити активним
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Активний
                    </span>
                  )}

                  {accounts.length > 1 && (
                    <button
                      onClick={() => onDeleteAccount(acc.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Видалити акаунт з пулу"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Антибан безпека:</strong> CRM автоматично змінює проксі по колу при кожній зміні акаунту або новому дзвінку. Навіть якщо у вас всього 2 проксі, кожен наступний акаунт гарантовано отримує наступну IP-адресу по черзі, мінімізуючи ризик блокування сесій Telegram.
        </p>
      </div>
        </div>
      )}

    </div>
  );
};

