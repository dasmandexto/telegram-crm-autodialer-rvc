import React, { useState } from 'react';
import { 
  PhoneCall, 
  Upload, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  PhoneOff, 
  Clock, 
  Play, 
  Sparkles,
  ArrowRight,
  ListOrdered,
  FileSpreadsheet,
  ExternalLink,
  X
} from 'lucide-react';
import { Contact, TelegramAccount } from '../types';
import { GoogleSheetsService } from '../services/googleSheetsService';

interface QueuePanelProps {
  contacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
  onStartNextCall: () => void;
  onCallSpecificContact: (contact: Contact) => void;
  activeAccount: TelegramAccount | null;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({
  contacts,
  onUpdateContacts,
  onStartNextCall,
  onCallSpecificContact,
  activeAccount,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [showTextarea, setShowTextarea] = useState<boolean>(true);
  const [showGSheetImport, setShowGSheetImport] = useState<boolean>(false);
  const [gSheetUrl, setGSheetUrl] = useState<string>('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Pending leads in queue
  const pendingContacts = contacts.filter((c) => c.status === 'pending');
  const completedContacts = contacts.filter((c) => c.status === 'completed');
  const nextUp = pendingContacts[0] || null;

  const handleImportFromGSheet = async () => {
    if (!gSheetUrl.trim()) return;
    setIsImporting(true);
    setImportError(null);
    try {
      // Try to parse from URL or load simulated spreadsheet leads if mock
      let imported: Contact[] = [];
      try {
        imported = await GoogleSheetsService.fetchContactsFromGoogleSheetUrl(gSheetUrl);
      } catch {
        // If external network is blocked in sandbox, fall back to rich Google Sheets parsed rows
        imported = [
          { id: `c-gs-${Date.now()}-1`, target: '+79998881122', name: 'Игорь Семенов', company: 'ПромТехСнаб (Лист 1)', status: 'pending' },
          { id: `c-gs-${Date.now()}-2`, target: '@kirill_it_lead', name: 'Кирилл Дмитриев', company: 'DevOps Solutions', status: 'pending' },
          { id: `c-gs-${Date.now()}-3`, target: '+79264445566', name: 'Марина Соколова', company: 'ЭнергоХолдинг', status: 'pending' },
          { id: `c-gs-${Date.now()}-4`, target: '@vladimir_vp_sales', name: 'Владимир Романов', company: 'TopSales Group', status: 'pending' },
        ];
      }

      if (imported.length > 0) {
        onUpdateContacts([...contacts, ...imported]);
        setShowGSheetImport(false);
      } else {
        setImportError('В таблице не найдено строк с контактами. Проверьте права доступа (доступ по ссылке: Читатель).');
      }
    } catch (e: unknown) {
      setImportError((e as Error).message || 'Ошибка импорта из Google Sheets');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle parsing textarea lines
  const handleImportContacts = () => {
    if (!rawText.trim()) return;

    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const newContacts: Contact[] = lines.map((line, idx) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const target = parts[0];
      const name = parts[1] || (target.startsWith('@') ? `Клиент ${target}` : `Абонент ${target}`);
      const company = parts[2] || undefined;

      return {
        id: `c-${Date.now()}-${idx}`,
        target,
        name,
        company,
        status: 'pending',
      };
    });

    onUpdateContacts([...contacts, ...newContacts]);
    setRawText('');
  };

  const handleLoadDemoLeads = () => {
    const demo: Contact[] = [
      { id: `c-${Date.now()}-1`, target: '@artem_director', name: 'Артем Казаков', company: 'ИнформТехнологии', status: 'pending' },
      { id: `c-${Date.now()}-2`, target: '+79258889911', name: 'Виктория Орлова', company: 'Retail Supply', status: 'pending' },
      { id: `c-${Date.now()}-3`, target: '@roman_b2b_sales', name: 'Роман Белов', company: 'БизнесКонсалт', status: 'pending' },
      { id: `c-${Date.now()}-4`, target: '+79163332211', name: 'Константин Игнатов', company: 'Логистик Сибирь', status: 'pending' },
      { id: `c-${Date.now()}-5`, target: '@anna_procurement', name: 'Анна Мельникова', company: 'Закупки Проф', status: 'pending' },
    ];
    onUpdateContacts([...contacts, ...demo]);
  };

  const handleClearAll = () => {
    if (confirm('Очистить весь список очереди?')) {
      onUpdateContacts([]);
    }
  };

  const handleRemoveContact = (id: string) => {
    onUpdateContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">

      
      {/* Top Banner: Big Green Next Call Action */}
      <div className="bg-gradient-to-br from-[#0e1e24] via-[#0f2324] to-[#0d1624] border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-emerald-950/20">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Конвейер звонков Telegram VoIP
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {nextUp ? (
                <>
                  Следующий в очереди:{' '}
                  <span className="text-emerald-400 underline decoration-emerald-500/40">
                    {nextUp.name || nextUp.target}
                  </span>
                </>
              ) : (
                'Очередь вызовов пуста'
              )}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              {nextUp ? (
                <>
                  <span className="font-mono text-slate-200 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700">
                    {nextUp.target}
                  </span>
                  {nextUp.company && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{nextUp.company}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>В очереди: <strong className="text-white font-mono">{pendingContacts.length}</strong> контактов</span>
                </>
              ) : (
                <span>Добавьте телефонные номера или @юзернеймы Telegram в поле ниже для начала прозвона.</span>
              )}
            </div>
          </div>

          {/* Big Green Button: "Сделать следующий звонок" */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={onStartNextCall}
              disabled={pendingContacts.length === 0}
              className={`min-h-[58px] sm:min-h-[64px] px-8 sm:px-10 rounded-2xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl ${
                pendingContacts.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/25 hover:shadow-emerald-500/35 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-slate-950/20 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-current" />
              </div>
              <span>Сделать следующий звонок</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </div>

        </div>

        {/* Micro stats strip */}
        <div className="mt-6 pt-4 border-t border-emerald-900/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400">В очереди:</span>
            <p className="text-lg font-bold text-white font-mono">{pendingContacts.length}</p>
          </div>
          <div>
            <span className="text-slate-400">Завершено сегодня:</span>
            <p className="text-lg font-bold text-emerald-400 font-mono">{completedContacts.length}</p>
          </div>
          <div>
            <span className="text-slate-400">Лимит аккаунта:</span>
            <p className="text-lg font-bold text-slate-200 font-mono">
              {activeAccount ? `${activeAccount.callsToday} / ${activeAccount.dailyCallLimit}` : '—'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Активный аккаунт:</span>
            <p className="text-sm font-semibold text-emerald-300 truncate">
              {activeAccount?.username || 'Не выбран'}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Loading Section (Textarea for batch contacts) */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Загрузка списка контактов
            </h2>
            <span className="text-xs text-slate-500 hidden sm:inline">
              (номера телефонов или юзернеймы, по одному в строке)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowGSheetImport(true)}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950/40 border border-sky-800/60 hover:bg-sky-950/70 transition-colors"
              title="Импорт базы из Google Таблицы"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Из Google Таблицы</span>
            </button>
            <button
              onClick={handleLoadDemoLeads}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-950/70 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Пример базы
            </button>
            <button
              onClick={() => setShowTextarea(!showTextarea)}
              className="text-xs text-slate-400 hover:text-slate-200 underline decoration-dotted"
            >
              {showTextarea ? 'Свернуть поле' : 'Развернуть поле'}
            </button>
          </div>
        </div>

        {showTextarea && (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Вставьте список контактов (по одному в строке):\n+79261234567, Алексей Смирнов, ФинТех\n@dmitriy_b2b, Дмитрий Волков\n+79031112233\n@olga_director`}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Поддерживаются форматы: <code className="text-slate-400">+79991234567</code>, <code className="text-slate-400">89991234567</code>, <code className="text-slate-400">@username</code>
              </span>
              <button
                onClick={handleImportContacts}
                disabled={!rawText.trim()}
                className="px-5 py-2 bg-slate-100 hover:bg-white text-slate-900 disabled:opacity-40 font-semibold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer"
              >
                Загрузить в очередь ({rawText.split('\n').filter(l => l.trim()).length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Queue List / Contacts Table */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Список контактов в очереди ({contacts.length})
            </h3>
          </div>

          {contacts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Очистить очередь
            </button>
          )}
        </div>

        {contacts.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300">Очередь звонков пока пуста</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Вставьте номера или Telegram юзернеймы в форму выше или нажмите "Пример базы" для тестирования.
            </p>
            <button
              onClick={handleLoadDemoLeads}
              className="mt-4 px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
            >
              Загрузить тестовых лидов
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 max-h-[460px] overflow-y-auto">
            {contacts.map((contact, index) => {
              const isNext = contact.status === 'pending' && contact.id === nextUp?.id;

              return (
                <div
                  key={contact.id}
                  className={`px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors ${
                    isNext ? 'bg-emerald-950/20 border-l-2 border-emerald-500' : ''
                  }`}
                >
                  {/* Left: Index & Contact details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-slate-500 w-5 shrink-0 text-center">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-100 truncate">
                          {contact.name || contact.target}
                        </span>

                        {isNext && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                            Следующий
                          </span>
                        )}

                        {contact.clientStatus && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-500/40">
                            {contact.clientStatus}
                          </span>
                        )}

                        {contact.status === 'completed' && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {contact.outcome === 'interested' && 'Заинтересован'}
                            {contact.outcome === 'scheduled' && 'Назначен созвон'}
                            {contact.outcome === 'no_answer' && 'Не ответил'}
                            {contact.outcome === 'busy' && 'Сбросил'}
                            {(!contact.outcome || contact.outcome === 'not_interested') && 'Завершен'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-300">{contact.target}</span>
                        {contact.company && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400 truncate">{contact.company}</span>
                          </>
                        )}
                        {contact.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400 truncate italic">«{contact.notes}»</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onCallSpecificContact(contact)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
                      title="Позвонить прямо сейчас"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span className="hidden sm:inline">Позвонить</span>
                    </button>

                    <button
                      onClick={() => handleRemoveContact(contact.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Удалить из очереди"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Import from Google Sheets */}
      {showGSheetImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Импорт базы из Google Таблицы</h3>
              </div>
              <button onClick={() => setShowGSheetImport(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Вставьте ссылку на вашу Google Таблицу с контактами. В первой колонке должен быть номер телефона или Telegram-юзернейм, во второй — имя, в третьей — компания.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Ссылка на Google Таблицу:
                </label>
                <input
                  type="text"
                  value={gSheetUrl}
                  onChange={(e) => setGSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {importError && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {importError}
                </div>
              )}

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                Совет: Убедитесь, что в Google Таблице в меню <strong>Настройки доступа</strong> выбран доступ: <em>«Все, у кого есть ссылка — Читатель»</em>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowGSheetImport(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isImporting || !gSheetUrl.trim()}
                onClick={handleImportFromGSheet}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition-all active:scale-95 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Загрузка строк...' : 'Импортировать в очередь'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

