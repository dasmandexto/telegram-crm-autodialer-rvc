import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  PhoneCall, 
  Plus, 
  CheckCircle2, 
  User, 
  X,
  AlertCircle
} from 'lucide-react';
import { CallReminder, Contact } from '../types';

interface CalendarViewProps {
  reminders: CallReminder[];
  onAddReminder: (reminder: CallReminder) => void;
  onDeleteReminder: (id: string) => void;
  onCallContact: (target: string, name: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  reminders,
  onAddReminder,
  onDeleteReminder,
  onCallContact,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slotModalData, setSlotModalData] = useState<{ time: string; dateStr: string } | null>(null);

  // Form for booking a free slot
  const [newContactTarget, setNewContactTarget] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Date helper formatting
  const pad = (n: number) => n.toString().padStart(2, '0');
  const getIsoDateString = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const currentDateStr = getIsoDateString(selectedDate);

  // Navigation
  const handlePrev = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() - (viewMode === 'day' ? 1 : 7));
    setSelectedDate(next);
  };

  const handleNext = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + (viewMode === 'day' ? 1 : 7));
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Hours to show in calendar (09:00 to 19:00)
  const hours = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // Week days
  const getWeekDays = () => {
    const days = [];
    const curr = new Date(selectedDate);
    // Find Monday
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const handleSlotClick = (dateStr: string, time: string) => {
    setSlotModalData({ dateStr, time });
    setNewContactTarget('');
    setNewContactName('');
    setNewNotes('');
  };

  const handleCreateSlotReminder = () => {
    if (!slotModalData || !newContactTarget.trim()) return;

    const newRem: CallReminder = {
      id: `rem-${Date.now()}`,
      contactTarget: newContactTarget.trim(),
      contactName: newContactName.trim() || newContactTarget.trim(),
      dateTime: `${slotModalData.dateStr}T${slotModalData.time}`,
      durationMinutes: 30,
      notes: newNotes.trim() || 'Запланированный звонок из календаря',
      account: '@hunter_sales_1',
      completed: false,
    };

    onAddReminder(newRem);
    setSlotModalData(null);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Calendar Toolbar */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Интерактивный календарь звонков
            </h2>
            <p className="text-xs text-slate-400">
              Свободные слоты подсвечены для удобного назначения следующего контакта
            </p>
          </div>
        </div>

        {/* View Switcher & Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Day / Week segmented control */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              День
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Неделя
            </button>
          </div>

          {/* Date navigator */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
              title="Назад"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300"
            >
              Сегодня
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
              title="Вперед"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-300 px-2 font-mono">
            {selectedDate.toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

      </div>

      {/* Legend Banner */}
      <div className="flex items-center gap-4 text-xs text-slate-400 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500/60"></div>
          <span>Запланированный звонок-напоминание</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-dashed border-slate-700 bg-slate-900/30"></div>
          <span className="text-emerald-400 font-medium">Свободный слот (доступен для записи)</span>
        </div>
      </div>

      {/* Calendar Grid: Day View */}
      {viewMode === 'day' && (
        <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Временная шкала дня (09:00 — 19:00)
            </span>
            <span className="text-xs text-slate-400">
              Нажмите на свободный слот для назначения звонка
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {hours.map((hour) => {
              // Check if any reminder matches this date and hour
              const reminder = reminders.find((r) => {
                const [rDate, rTime] = r.dateTime.split('T');
                if (rDate !== currentDateStr) return false;
                const rHour = rTime.slice(0, 2);
                return rHour === hour.slice(0, 2);
              });

              return (
                <div
                  key={hour}
                  className="px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition-colors hover:bg-slate-850"
                >
                  {/* Time label */}
                  <div className="w-20 shrink-0 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{hour}</span>
                  </div>

                  {/* Content: Either Booked Block or Free Slot */}
                  {reminder ? (
                    <div className="flex-1 bg-gradient-to-r from-sky-950/40 to-slate-900 border border-sky-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {reminder.contactName}
                          </span>
                          <span className="font-mono text-xs text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800/60">
                            {reminder.contactTarget}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 italic">
                          «{reminder.notes}»
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Звонок с аккаунта: {reminder.account}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onCallContact(reminder.contactTarget, reminder.contactName)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow active:scale-95 transition-all"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Позвонить</span>
                        </button>
                        <button
                          onClick={() => onDeleteReminder(reminder.id)}
                          className="text-slate-500 hover:text-rose-400 text-xs p-1.5 transition-colors"
                          title="Отменить напоминание"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSlotClick(currentDateStr, hour)}
                      className="flex-1 group text-left border border-dashed border-slate-700/80 hover:border-emerald-500/80 bg-slate-900/30 hover:bg-emerald-950/20 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500/60 group-hover:scale-125 transition-transform"></span>
                        <span className="text-xs text-slate-400 group-hover:text-emerald-300 font-medium">
                          Свободный слот — клик для быстрого назначения
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400 group-hover:underline flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        Занять слот {hour}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Grid: Week View */}
      {viewMode === 'week' && (
        <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
          <div className="min-w-[760px]">
            {/* Week header row */}
            <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-900/60 text-xs font-bold text-slate-300 py-3 text-center">
              <div className="py-1 text-slate-500">Время</div>
              {weekDays.map((d) => {
                const dStr = getIsoDateString(d);
                const isSelected = dStr === currentDateStr;
                return (
                  <div
                    key={dStr}
                    className={`py-1 cursor-pointer transition-colors ${
                      isSelected ? 'text-sky-400 font-extrabold' : 'hover:text-white'
                    }`}
                    onClick={() => setSelectedDate(d)}
                  >
                    <div>{d.toLocaleDateString('ru-RU', { weekday: 'short' })}</div>
                    <div className="text-sm font-mono">{d.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {/* Week hours rows */}
            <div className="divide-y divide-slate-800/60">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 min-h-[58px]">
                  <div className="text-xs font-mono font-medium text-slate-500 p-2 flex items-center justify-center border-r border-slate-800/80">
                    {hour}
                  </div>

                  {weekDays.map((d) => {
                    const dStr = getIsoDateString(d);
                    const reminder = reminders.find((r) => {
                      const [rDate, rTime] = r.dateTime.split('T');
                      return rDate === dStr && rTime.slice(0, 2) === hour.slice(0, 2);
                    });

                    return (
                      <div
                        key={dStr}
                        className="p-1 border-r border-slate-800/40 relative group"
                      >
                        {reminder ? (
                          <div
                            onClick={() => onCallContact(reminder.contactTarget, reminder.contactName)}
                            className="w-full h-full p-1.5 rounded-lg bg-sky-950/60 border border-sky-500/50 hover:border-emerald-400 text-left transition-all cursor-pointer flex flex-col justify-between"
                            title={`${reminder.contactName}: ${reminder.notes}`}
                          >
                            <span className="text-[11px] font-bold text-white truncate block">
                              {reminder.contactName}
                            </span>
                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                              <PhoneCall className="w-2.5 h-2.5" />
                              Позвонить
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSlotClick(dStr, hour)}
                            className="w-full h-full rounded-lg border border-transparent hover:border-dashed hover:border-emerald-500/60 hover:bg-emerald-950/20 text-center flex items-center justify-center text-[10px] text-transparent hover:text-emerald-400 transition-all cursor-pointer"
                          >
                            + Слот
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal to book a free slot */}
      {slotModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Назначить звонок на {slotModalData.time}
                </h3>
              </div>
              <button
                onClick={() => setSlotModalData(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Контакт (телефон или @юзернейм) *
                </label>
                <input
                  type="text"
                  value={newContactTarget}
                  onChange={(e) => setNewContactTarget(e.target.value)}
                  placeholder="@ivan_tele или +79261234567"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Имя / Компания клиента
                </label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Иван Петров (Снабжение)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Заметка к звонку
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Презентация продукта, уточнение условий сделки..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSlotModalData(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateSlotReminder}
                disabled={!newContactTarget.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow transition-all"
              >
                Сохранить слот
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
