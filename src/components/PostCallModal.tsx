import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  FileText, 
  MessageSquare, 
  Check, 
  Sparkles,
  PhoneCall,
  Tag,
  FolderTree,
  Trash2,
  Dices,
  Image as ImageIcon,
  Mic,
  Video,
  Film,
  Paperclip,
  X
} from 'lucide-react';
import { 
  Contact, 
  TelegramAccount, 
  MessageTemplate, 
  LeadOutcome, 
  ClientStatusDefinition,
  TemplateMediaAttachment,
  TemplateMediaType 
} from '../types';
import { sounds } from '../services/soundEffects';
import { SpintaxService } from '../services/spintax';

interface PostCallModalProps {
  contact: Contact;
  account: TelegramAccount;
  durationSeconds: number;
  templates: MessageTemplate[];
  clientStatuses?: ClientStatusDefinition[];
  onOpenNewTemplateModal: () => void;
  onDeleteTemplate?: (tplId: string) => void;
  onSaveAndNext: (data: {
    outcome: LeadOutcome;
    clientStatus?: string;
    clientStatusId?: string;
    clientStatusGroup?: string;
    clientStatusColor?: string;
    notes: string;
    reminderDateTime?: string;
    messageSent?: { 
      text: string; 
      sent: boolean; 
      templateTitle?: string;
      mediaAttachment?: TemplateMediaAttachment;
    };
    callNextImmediately: boolean;
  }) => void;
  onClose: () => void;
}

export const PostCallModal: React.FC<PostCallModalProps> = ({
  contact,
  account,
  durationSeconds,
  templates,
  clientStatuses = [],
  onOpenNewTemplateModal,
  onDeleteTemplate,
  onSaveAndNext,
  onClose,
}) => {
  const [outcome, setOutcome] = useState<LeadOutcome>(() => {
    return contact.outcome || 'interested';
  });

  const [selectedStatusId, setSelectedStatusId] = useState<string>(() => {
    if (contact.clientStatusId) return contact.clientStatusId;
    if (contact.clientStatus) {
      const match = clientStatuses.find((s) => s.label.toLowerCase() === contact.clientStatus?.toLowerCase());
      if (match) return match.id;
    }
    return clientStatuses[0]?.id || 'status_refused_contact';
  });

  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [notes, setNotes] = useState<string>(contact.notes || '');
  const [reminderDateTime, setReminderDateTime] = useState<string>('');
  
  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  
  // Attached media for the current message (defaults to template's attachment, can be edited)
  const [currentMediaAttachment, setCurrentMediaAttachment] = useState<TemplateMediaAttachment | undefined>(
    templates[0]?.mediaAttachment
  );

  // Message text
  const [messageText, setMessageText] = useState<string>(() => {
    const tpl = templates[0];
    if (!tpl) return '';
    const spun = SpintaxService.spin(tpl.content);
    return spun.replace('{имя}', contact.name || 'партнер').replace('{время}', 'завтра');
  });

  const [messageSent, setMessageSent] = useState<boolean>(false);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const hasSpintax = selectedTemplate ? SpintaxService.hasSpintax(selectedTemplate.content) : false;
  const spintaxCombinations = selectedTemplate ? SpintaxService.countCombinations(selectedTemplate.content) : 1;

  // Sync template change
  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    setConfirmDeleteTemplateId(null);
    const found = templates.find((t) => t.id === tplId);
    if (found) {
      setCurrentMediaAttachment(found.mediaAttachment);
      const spun = SpintaxService.spin(found.content);
      const parsed = spun
        .replace('{имя}', contact.name || 'коллега')
        .replace('{время}', reminderDateTime ? reminderDateTime.replace('T', ' в ') : 'в ближайшее время')
        .replace('{id}', Math.floor(Math.random() * 8999 + 1000).toString());
      setMessageText(parsed);
    }
  };

  // Re-spin spintax on demand
  const handleRerollSpintax = () => {
    if (!selectedTemplate) return;
    setIsSpinning(true);
    sounds.playVoiceSwap();
    setTimeout(() => {
      const spun = SpintaxService.spin(selectedTemplate.content);
      const parsed = spun
        .replace('{имя}', contact.name || 'коллега')
        .replace('{время}', reminderDateTime ? reminderDateTime.replace('T', ' в ') : 'в ближайшее время')
        .replace('{id}', Math.floor(Math.random() * 8999 + 1000).toString());
      setMessageText(parsed);
      setIsSpinning(false);
    }, 150);
  };

  // Delete selected template
  const handleDeleteSelectedTemplate = () => {
    if (!selectedTemplate || !onDeleteTemplate) return;
    if (confirmDeleteTemplateId !== selectedTemplate.id) {
      setConfirmDeleteTemplateId(selectedTemplate.id);
      return;
    }

    const tplToDeleteId = selectedTemplate.id;
    onDeleteTemplate(tplToDeleteId);
    setConfirmDeleteTemplateId(null);

    // Switch to another template
    const remaining = templates.filter((t) => t.id !== tplToDeleteId);
    if (remaining.length > 0) {
      handleSelectTemplate(remaining[0].id);
    } else {
      setSelectedTemplateId('');
      setMessageText('');
      setCurrentMediaAttachment(undefined);
    }
  };

  // Quick reminder shortcuts
  const setQuickReminder = (hoursAhead: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursAhead);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
    setReminderDateTime(str);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !currentMediaAttachment) return;
    setIsSendingMessage(true);
    await new Promise((r) => setTimeout(r, 450));
    setIsSendingMessage(false);
    setMessageSent(true);
    sounds.playMessageSent();
  };

  const handleFinish = (callNext: boolean) => {
    const activeDef = clientStatuses.find((s) => s.id === selectedStatusId);
    const statusLabel = customTagInput.trim() || activeDef?.label || 'Без статуса';
    const statusGroup = activeDef?.group || 'Общее';
    const statusColor = activeDef?.color || 'sky';

    onSaveAndNext({
      outcome,
      clientStatus: statusLabel,
      clientStatusId: selectedStatusId,
      clientStatusGroup: statusGroup,
      clientStatusColor: statusColor,
      notes,
      reminderDateTime: reminderDateTime || undefined,
      messageSent: messageSent
        ? { 
            text: messageText, 
            sent: true, 
            templateTitle: selectedTemplate?.title,
            mediaAttachment: currentMediaAttachment
          }
        : { sent: false, text: '' },
      callNextImmediately: callNext,
    });
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} мин ${s} сек`;
  };

  // Status color styles mapping
  const getStatusBadgeStyle = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700';
    }
    switch (color) {
      case 'amber':
        return 'border-amber-500/80 bg-amber-950/40 text-amber-200 ring-1 ring-amber-400/40 font-semibold shadow-sm';
      case 'rose':
        return 'border-rose-500/80 bg-rose-950/40 text-rose-200 ring-1 ring-rose-400/40 font-semibold shadow-sm';
      case 'slate':
        return 'border-slate-400/80 bg-slate-800/60 text-slate-100 ring-1 ring-slate-400/40 font-semibold shadow-sm';
      case 'purple':
        return 'border-purple-500/80 bg-purple-950/40 text-purple-200 ring-1 ring-purple-400/40 font-semibold shadow-sm';
      case 'emerald':
        return 'border-emerald-500/80 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-400/40 font-semibold shadow-sm';
      case 'sky':
        return 'border-sky-500/80 bg-sky-950/40 text-sky-200 ring-1 ring-sky-400/40 font-semibold shadow-sm';
      case 'orange':
        return 'border-orange-500/80 bg-orange-950/40 text-orange-200 ring-1 ring-orange-400/40 font-semibold shadow-sm';
      default:
        return 'border-sky-500/80 bg-sky-950/40 text-sky-200 ring-1 ring-sky-400/40 font-semibold shadow-sm';
    }
  };

  const renderMediaBadge = (type: TemplateMediaType) => {
    switch (type) {
      case 'image':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/30"><ImageIcon className="w-3 h-3" /> Фото</span>;
      case 'audio':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-950 text-sky-300 border border-sky-500/30"><Mic className="w-3 h-3" /> Аудио</span>;
      case 'video':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950 text-purple-300 border border-purple-500/30"><Video className="w-3 h-3" /> Видео</span>;
      case 'gif':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-pink-950 text-pink-300 border border-pink-500/30"><Film className="w-3 h-3" /> GIF</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Итоги звонка: {contact.name || contact.target}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span>{contact.target}</span>
              <span aria-hidden="true">·</span>
              <span>Длительность: <strong className="text-slate-200 font-mono">{formatDuration(durationSeconds)}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Аккаунт: <strong className="text-emerald-400">{account.username}</strong></span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            Закрыть
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto">

          {/* 1. Client Status & Group (Специальный статус клиента для выгрузки в Google Таблицы) */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                Статус / Группа клиента для Google Таблиц
              </label>
              <span className="text-[11px] text-slate-400">
                Синхронизируется отдельной колонкой
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Выберите статус для номера <strong>{contact.target}</strong>. По этому тегу и группе можно выгружать базы и фильтровать списки в Google Sheets:
            </p>

            {/* Configured Status Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {clientStatuses.map((st) => {
                const isSelected = selectedStatusId === st.id && !customTagInput;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedStatusId(st.id);
                      setCustomTagInput('');
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition-all ${getStatusBadgeStyle(
                      st.color,
                      isSelected
                    )}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold">{st.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-current shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <FolderTree className="w-2.5 h-2.5 opacity-70" />
                      <span>Группа: {st.group}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom status input */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2">
              <span className="text-[11px] text-slate-400 shrink-0">Или свой статус:</span>
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Например: перезвонить в пятницу, дорого..."
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              {customTagInput && (
                <button
                  type="button"
                  onClick={() => setCustomTagInput('')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>
          
          {/* 2. Call Outcome Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Технический результат звонка
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'interested', label: 'Заинтересован', color: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300' },
                { id: 'scheduled', label: 'Договорились о созвоне', color: 'border-sky-500/60 bg-sky-950/30 text-sky-300' },
                { id: 'no_answer', label: 'Не ответил', color: 'border-amber-500/60 bg-amber-950/30 text-amber-300' },
                { id: 'busy', label: 'Сбросил / Занят', color: 'border-orange-500/60 bg-orange-950/30 text-orange-300' },
                { id: 'not_interested', label: 'Не актуально', color: 'border-slate-600 bg-slate-800/40 text-slate-400' },
                { id: 'wrong_number', label: 'Неверный контакт', color: 'border-rose-500/60 bg-rose-950/30 text-rose-300' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOutcome(item.id as LeadOutcome)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition-all ${
                    outcome === item.id
                      ? `${item.color} ring-1 ring-emerald-400/30 font-semibold shadow-sm`
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.label}</span>
                    {outcome === item.id && <Check className="w-3.5 h-3.5 text-current shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Call Notes / Comment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Комментарий к звонку
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="hidden sm:inline">Быстрые заметки:</span>
                <button
                  type="button"
                  onClick={() => setNotes((prev) => (prev ? `${prev}; ` : '') + 'Запросил КП')}
                  className="hover:text-emerald-400 underline decoration-dotted"
                >
                  +КП
                </button>
                <button
                  type="button"
                  onClick={() => setNotes((prev) => (prev ? `${prev}; ` : '') + 'ЛПР вернется в понедельник')}
                  className="hover:text-emerald-400 underline decoration-dotted"
                >
                  +ЛПР
                </button>
              </div>
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Введите комментарий (о чем говорили, возражения, договоренности, бюджет)..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* 4. Reminder Date & Time */}
          <div className="bg-slate-900/40 border border-slate-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-sky-400" />
                Напоминание / Следующий контакт в Календаре
              </label>
              {reminderDateTime && (
                <button
                  type="button"
                  onClick={() => setReminderDateTime('')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Очистить (не создавать)
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="datetime-local"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition-colors font-mono"
                />
              </div>

              {/* Quick shortcuts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setQuickReminder(2)}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap active:scale-95 transition-all"
                >
                  +2 часа
                </button>
                <button
                  type="button"
                  onClick={() => setQuickReminder(24)}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap active:scale-95 transition-all"
                >
                  Завтра
                </button>
                <button
                  type="button"
                  onClick={() => setQuickReminder(72)}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap active:scale-95 transition-all"
                >
                  Через 3 дня
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
              {reminderDateTime
                ? 'Напоминание появится в интерактивном календаре на выбранный временной слот.'
                : 'Если оставить пустым — напоминание не создается.'}
            </p>
          </div>

          {/* 5. Telegram Message Sending Block (With Spintax, Media Attachments & Template Deletion) */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Отправка сообщения клиенту в Telegram
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenNewTemplateModal}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Новый шаблон
              </button>
            </div>

            {/* Template selector row with Delete button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Шаблон сообщения:
                </label>

                {/* Spintax indicator */}
                {hasSpintax && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/70 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Спинтакс: ~{spintaxCombinations} вариантов
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      [{tpl.category}] {tpl.title} {tpl.mediaAttachment ? `(${tpl.mediaAttachment.type.toUpperCase()})` : ''}
                    </option>
                  ))}
                </select>

                {/* Delete current template button */}
                {onDeleteTemplate && templates.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedTemplate}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${
                      confirmDeleteTemplateId === selectedTemplate?.id
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-700/60 text-slate-400 border-slate-700'
                    }`}
                    title={
                      confirmDeleteTemplateId === selectedTemplate?.id
                        ? 'Нажмите еще раз для подтверждения удаления'
                        : 'Удалить этот шаблон'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {confirmDeleteTemplateId === selectedTemplate?.id ? 'Удалить?' : 'Удалить'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Attached Media Box (Фото / Видео / Аудио / GIF) */}
            {currentMediaAttachment && currentMediaAttachment.type !== 'none' && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Прикрепленное медиа-вложение:
                    </span>
                    {renderMediaBadge(currentMediaAttachment.type)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentMediaAttachment(undefined)}
                    className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    title="Удалить медиа из этого отправления"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Убрать</span>
                  </button>
                </div>

                {/* Visual Preview based on type */}
                <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 p-2 flex items-center justify-center">
                  {currentMediaAttachment.type === 'image' && (
                    <div className="space-y-1.5 text-center">
                      <img
                        src={currentMediaAttachment.url}
                        alt="Превью"
                        className="max-h-36 rounded-lg object-contain mx-auto"
                      />
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {currentMediaAttachment.name} ({currentMediaAttachment.sizeKb || 240} КБ)
                      </span>
                    </div>
                  )}

                  {currentMediaAttachment.type === 'gif' && (
                    <div className="space-y-1.5 text-center">
                      <img
                        src={currentMediaAttachment.url}
                        alt="GIF Стикер"
                        className="max-h-36 rounded-lg object-contain mx-auto"
                      />
                      <span className="text-[11px] text-pink-300 block font-mono">
                        {currentMediaAttachment.name} (GIF анимация)
                      </span>
                    </div>
                  )}

                  {currentMediaAttachment.type === 'video' && (
                    <div className="w-full space-y-1.5">
                      <video
                        src={currentMediaAttachment.url}
                        controls
                        className="max-h-40 rounded-lg w-full"
                      />
                      <span className="text-[11px] text-purple-300 block font-mono text-center">
                        {currentMediaAttachment.name} ({currentMediaAttachment.sizeKb || 1400} КБ)
                      </span>
                    </div>
                  )}

                  {currentMediaAttachment.type === 'audio' && (
                    <div className="w-full p-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-sky-400">
                        <span className="flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 animate-pulse" />
                          <strong>Голосовое сообщение (MP3):</strong> {currentMediaAttachment.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {currentMediaAttachment.sizeKb || 180} КБ
                        </span>
                      </div>
                      <audio
                        src={currentMediaAttachment.url}
                        controls
                        className="w-full h-8"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Editable message textarea with Spintax Reroll CTA */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400">
                  Текст сообщения (редактируемый перед отправкой):
                </label>

                {/* Spintax Reroll Button */}
                {hasSpintax && (
                  <button
                    type="button"
                    onClick={handleRerollSpintax}
                    disabled={isSpinning}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                    title="Сгенерировать случайную комбинацию из спинтакса шаблона"
                  >
                    <Dices className={`w-3.5 h-3.5 text-amber-400 ${isSpinning ? 'animate-spin' : ''}`} />
                    <span>Другой вариант (Спинтакс)</span>
                  </button>
                )}
              </div>

              <textarea
                rows={3}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Текст сообщения для отправки в Telegram..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            {/* Send message button & Status */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-400">
                Отправка с аккаунта: <strong className="text-slate-200">{account.username}</strong>
                {currentMediaAttachment && (
                  <span className="text-emerald-400 ml-1.5">+ медиа-файл</span>
                )}
              </span>

              {messageSent ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs font-medium text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Сообщение и медиа успешно отправлены!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={(!messageText.trim() && !currentMediaAttachment) || isSendingMessage}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  {isSendingMessage ? (
                    <span>Отправка в Telegram...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Отправить в Telegram</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-7 py-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleFinish(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors text-center"
          >
            Сохранить и вернуться в очередь
          </button>

          {/* Primary CTA: "Продолжить / Следующий звонок" */}
          <button
            type="button"
            onClick={() => handleFinish(true)}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Продолжить / Следующий звонок</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
