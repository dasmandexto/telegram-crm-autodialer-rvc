import { Contact, TelegramAccount, CallReminder, MessageTemplate, InboxEvent, CRMSettings } from '../types';

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    target: '@dmitriy_b2b',
    name: 'Дмитрий Волков',
    company: 'Logistics Pro',
    status: 'pending',
  },
  {
    id: 'c-2',
    target: '+79261234567',
    name: 'Алексей Смирнов',
    company: 'FinTech Cloud',
    status: 'pending',
  },
  {
    id: 'c-3',
    target: '@olga_marketing',
    name: 'Ольга Кузнецова',
    company: 'MediaGroup Digital',
    status: 'pending',
  },
  {
    id: 'c-4',
    target: '+79165554321',
    name: 'Михаил Соколов',
    company: 'E-com Retail Hub',
    status: 'pending',
  },
  {
    id: 'c-5',
    target: '@sergey_director',
    name: 'Сергей Морозов',
    company: 'СтройКомплект',
    status: 'pending',
  },
  {
    id: 'c-6',
    target: '+79037778899',
    name: 'Елена Васильева',
    company: 'ИнвестКапитал',
    status: 'pending',
  },
  {
    id: 'c-7',
    target: '@pavel_techlead',
    name: 'Павел Новиков',
    company: 'SaaS Platform',
    status: 'pending',
  },
];

const INITIAL_ACCOUNTS: TelegramAccount[] = [
  {
    id: 'acc-1',
    phone: '+7 999 444-12-01',
    username: '@hunter_sales_1',
    displayName: 'Sales Account Alpha',
    avatarColor: 'bg-emerald-600',
    dailyCallLimit: 35,
    callsToday: 18,
    status: 'active',
    proxy: 'SOCKS5: 185.122.90.14:1080 (RU)',
    sessionFile: 'session_alpha_1.session',
  },
  {
    id: 'acc-2',
    phone: '+7 999 444-12-02',
    username: '@hunter_sales_2',
    displayName: 'Sales Account Beta',
    avatarColor: 'bg-blue-600',
    dailyCallLimit: 35,
    callsToday: 24,
    status: 'active',
    proxy: 'SOCKS5: 185.122.90.15:1080 (RU)',
    sessionFile: 'session_beta_2.session',
  },
  {
    id: 'acc-3',
    phone: '+7 999 444-12-03',
    username: '@hunter_sales_3',
    displayName: 'Sales Account Gamma',
    avatarColor: 'bg-purple-600',
    dailyCallLimit: 35,
    callsToday: 6,
    status: 'warming',
    proxy: 'SOCKS5: 185.122.90.16:1080 (RU)',
    sessionFile: 'tdata_gamma_folder',
  },
];

const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Коммерческое предложение (с изображением КП)',
    category: 'Пост-звонок',
    content: '{Здравствуйте|Добрый день|Приветствую}, {имя}! {Договорились на созвоне|Как и обсуждали во время звонка} в Telegram. {Направляю|Прикрепляю|Высылаю} краткую презентацию и расчет окупаемости для вашей компании: https://teledial.crm/proposal/{id}\n{Буду рад ответить на любые вопросы!|С удовольствием отвечу на детали в удобное время!}',
    mediaAttachment: {
      type: 'image',
      name: 'КП_Презентация_Тарифов.png',
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
      sizeKb: 245,
    },
  },
  {
    id: 'tpl-2',
    title: 'Не дозвонился — голосовая аудио-заметка',
    category: 'Дозвон',
    content: '{Добрый день|Здравствуйте|Приветствую}, {имя}! {Не удалось до вас дозвониться|Пытался набрать вас по аудио}. {Записал краткое голосовое сообщение на 20 секунд|Прикрепляю короткую аудио-заметку с сутью предложения}. {Подскажите, в какое время вам удобно созвониться на 5 минут?|Буду очень признателен за обратную связь!}',
    mediaAttachment: {
      type: 'audio',
      name: 'Голосовое_сообщение_менеджера.mp3',
      url: 'https://actions.google.com/sounds/v1/ambient/rain_heavy.ogg',
      sizeKb: 180,
    },
  },
  {
    id: 'tpl-3',
    title: 'Подтверждение запланированного созвона (с видео-демо)',
    category: 'Встречи',
    content: '{Добрый день|Здравствуйте|Привет}, {имя}! {Фиксирую нашу договоренность на созвон {время}|Подтверждаю встречу {время}}. {Прикрепляю короткое минутное видео о возможностях CRM|Посмотрите минутный видео-обзор перед созвоном}: https://teledial.crm/demo',
    mediaAttachment: {
      type: 'video',
      name: 'Видео_обзор_платформы.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      sizeKb: 1420,
    },
  },
  {
    id: 'tpl-4',
    title: 'Благодарность за диалог (GIF-стикер)',
    category: 'Лояльность',
    content: '{Отличного дня|Хорошей рабочей недели}, {имя}! {Спасибо за приятный диалог на созвоне|Рад был познакомиться}. {Всегда на связи в Telegram!|Если возникнут любые вопросы — сразу пишите сюда!}',
    mediaAttachment: {
      type: 'gif',
      name: 'Спасибо_за_звонок.gif',
      url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1aHk3Zjh3b2V1ZjlhNHlhZDF2OG10ZXd5eGttOTRraDJ6cWphdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/giphy.gif',
      sizeKb: 380,
    },
  },
];

// Helper to get formatted date string for today and tomorrow
const now = new Date();
const todayStr = now.toISOString().split('T')[0];

const INITIAL_REMINDERS: CallReminder[] = [
  {
    id: 'rem-1',
    contactTarget: '@dmitriy_b2b',
    contactName: 'Дмитрий Волков (Logistics Pro)',
    dateTime: `${todayStr}T10:00`,
    durationMinutes: 30,
    notes: 'Повторный звонок по согласованию договора на пилотный запуск',
    account: '@hunter_sales_1',
    completed: false,
  },
  {
    id: 'rem-2',
    contactTarget: '+79165554321',
    contactName: 'Михаил Соколов (Retail Hub)',
    dateTime: `${todayStr}T14:30`,
    durationMinutes: 30,
    notes: 'Демонстрация работы CRM и выгрузки базы контактов',
    account: '@hunter_sales_2',
    completed: false,
  },
  {
    id: 'rem-3',
    contactTarget: '@sergey_director',
    contactName: 'Сергей Морозов (СтройКомплект)',
    dateTime: `${todayStr}T16:00`,
    durationMinutes: 45,
    notes: 'Обсуждение интеграции с их текущей базой 1С',
    account: '@hunter_sales_1',
    completed: false,
  },
];

const INITIAL_INBOX: InboxEvent[] = [
  {
    id: 'inb-1',
    type: 'message',
    client: '@dmitriy_b2b',
    clientName: 'Дмитрий Волков',
    account: '@hunter_sales_1',
    timestamp: '14:22',
    previewText: 'Изучил ваше КП. Давайте согласуем созвон с техническим директором.',
    read: false,
  },
  {
    id: 'inb-2',
    type: 'missed_call',
    client: '+79037778899',
    clientName: 'Елена Васильева',
    account: '@hunter_sales_2',
    timestamp: '12:45',
    previewText: 'Входящий аудиовызов (12 сек, без ответа)',
    read: false,
  },
  {
    id: 'inb-3',
    type: 'message',
    client: '@olga_marketing',
    clientName: 'Ольга Кузнецова',
    account: '@hunter_sales_1',
    timestamp: '11:10',
    previewText: 'Добрый день, перезвоните пожалуйста после 17:00, сейчас на совещании.',
    read: true,
  },
  {
    id: 'inb-4',
    type: 'missed_call',
    client: '@pavel_techlead',
    clientName: 'Павел Новиков',
    account: '@hunter_sales_3',
    timestamp: 'Вчера 18:05',
    previewText: 'Пропущенный вызов в Telegram',
    read: true,
  },
];

import { CallHistoryRecord, ClientStatusDefinition } from '../types';

export const DEFAULT_CLIENT_STATUSES: ClientStatusDefinition[] = [
  {
    id: 'status_refused_contact',
    label: 'отказался но на контакт идёт',
    color: 'amber',
    group: 'Отказ (с шансом)',
    description: 'Отказ от прямого оффера, но готов к переписке и обсуждению деталей',
    isDefault: true,
  },
  {
    id: 'status_toxic_histeric',
    label: 'истеричка',
    color: 'rose',
    group: 'Сложные клиенты',
    description: 'Эмоциональный срыв, негатив, неадекватная реакция на звонок',
    isDefault: true,
  },
  {
    id: 'status_no_answer',
    label: 'не ответил',
    color: 'slate',
    group: 'Недозвон',
    description: 'Гудки без ответа, сброс до поднятия трубки',
    isDefault: true,
  },
  {
    id: 'status_privacy_closed',
    label: 'закрыты настройки',
    color: 'purple',
    group: 'Приватность',
    description: 'Запрет входящих звонков от неизвестных в настройках Telegram',
    isDefault: true,
  },
  {
    id: 'status_interested_hot',
    label: 'заинтересован (горячий)',
    color: 'emerald',
    group: 'Горячие',
    description: 'Прямой интерес, запросил КП, прайс или расчет окупаемости',
    isDefault: true,
  },
  {
    id: 'status_call_scheduled',
    label: 'согласован созвон',
    color: 'sky',
    group: 'Встречи',
    description: 'Зафиксировано точное время повторного звонка или демо-презентации',
    isDefault: true,
  },
  {
    id: 'status_spamblock_invalid',
    label: 'спамблок / неверный контакт',
    color: 'orange',
    group: 'Невалидные',
    description: 'Удаленный профиль, спамблок или неверный номер',
    isDefault: true,
  },
];

const INITIAL_HISTORY: CallHistoryRecord[] = [
  {
    id: 'hist-1',
    dateTime: '2026-10-22 16:45:12',
    target: '+79261234567',
    clientName: 'Алексей Смирнов',
    company: 'FinTech Cloud',
    outcome: 'успешно',
    clientStatus: 'заинтересован (горячий)',
    clientStatusId: 'status_interested_hot',
    clientStatusGroup: 'Горячие',
    clientStatusColor: 'emerald',
    durationSeconds: 142,
    notes: 'Очень заинтересованы в Telegram-автодозвоне для отдела продаж. Договорились о созвоне завтра.',
    message: {
      sent: true,
      templateTitle: 'Коммерческое предложение (после звонка)',
      text: 'Здравствуйте, Алексей! Договорились на созвоне в Telegram. Направляю краткую презентацию и расчет окупаемости: https://teledial.crm/proposal/4819',
      sentAt: '2026-10-22 16:48:02',
    },
    accountUsed: '@hunter_sales_1',
    syncedToGoogleSheets: true,
    hasAudioRecord: true,
  },
  {
    id: 'hist-2',
    dateTime: '2026-10-22 16:15:30',
    target: '@olga_marketing',
    clientName: 'Ольга Кузнецова',
    company: 'MediaGroup Digital',
    outcome: 'пропущен',
    clientStatus: 'не ответил',
    clientStatusId: 'status_no_answer',
    clientStatusGroup: 'Недозвон',
    clientStatusColor: 'slate',
    durationSeconds: 24,
    notes: 'Гудки 24 секунды, абонент не поднял трубку. Отправлено приветственное сообщение в Telegram.',
    message: {
      sent: true,
      templateTitle: 'Не дозвонился — приветствие в Telegram',
      text: 'Добрый день, Ольга! Пытался набрать вас по вопросу автоматизации лидогенерации и клиентских звонков. Подскажите, когда удобно созвониться?',
      sentAt: '2026-10-22 16:16:10',
    },
    accountUsed: '@hunter_sales_2',
    syncedToGoogleSheets: true,
    hasAudioRecord: false,
  },
  {
    id: 'hist-3',
    dateTime: '2026-10-22 15:50:05',
    target: '+79165554321',
    clientName: 'Михаил Соколов',
    company: 'E-com Retail Hub',
    outcome: 'успешно',
    clientStatus: 'согласован созвон',
    clientStatusId: 'status_call_scheduled',
    clientStatusGroup: 'Встречи',
    clientStatusColor: 'sky',
    durationSeconds: 215,
    notes: 'Обсудили интеграцию с базой 1С. Попросил прислать презентацию тарифов и назначить демо.',
    message: {
      sent: true,
      templateTitle: 'Презентация и кейсы аналогичных компаний',
      text: 'Приветствую, Михаил! Прикрепляю 3 свежих кейса, как компании вашего сектора сократили стоимость привлечения лида в 2.4 раза.',
      sentAt: '2026-10-22 15:54:15',
    },
    accountUsed: '@hunter_sales_1',
    syncedToGoogleSheets: true,
    hasAudioRecord: true,
  },
  {
    id: 'hist-4',
    dateTime: '2026-10-22 15:10:44',
    target: '@sergey_director',
    clientName: 'Сергей Морозов',
    company: 'СтройКомплект',
    outcome: 'не удалось',
    clientStatus: 'отказался но на контакт идёт',
    clientStatusId: 'status_refused_contact',
    clientStatusGroup: 'Отказ (с шансом)',
    clientStatusColor: 'amber',
    durationSeconds: 8,
    notes: 'Сбросил звонок, занят на совещании. Перезвонить через 2 часа, открыт к предложениям.',
    message: {
      sent: false,
    },
    accountUsed: '@hunter_sales_3',
    syncedToGoogleSheets: true,
    hasAudioRecord: false,
  },
  {
    id: 'hist-5',
    dateTime: '2026-10-22 14:20:18',
    target: '+79037778899',
    clientName: 'Елена Васильева',
    company: 'ИнвестКапитал',
    outcome: 'успешно',
    clientStatus: 'закрыты настройки',
    clientStatusId: 'status_privacy_closed',
    clientStatusGroup: 'Приватность',
    clientStatusColor: 'purple',
    durationSeconds: 98,
    notes: 'В Telegram закрыты входящие вызовы для не-контактов. Связались через сотовый, выслали инвайт.',
    message: {
      sent: true,
      templateTitle: 'Подтверждение запланированного созвона',
      text: 'Добрый день, Елена! Фиксирую договоренность на созвон завтра в 11:00.',
      sentAt: '2026-10-22 14:22:00',
    },
    accountUsed: '@hunter_sales_1',
    syncedToGoogleSheets: true,
    hasAudioRecord: true,
  },
];

const INITIAL_SETTINGS: CRMSettings = {
  dailyCallLimitPerAccount: 35,
  autoRotateAccounts: true,
  autoNextCallDelaySeconds: 3,
  soundEnabled: true,
  proxyRotationEnabled: true,
  currentProxyIndex: 0,
  proxies: [
    {
      id: 'prx-1',
      url: 'socks5://tg_user1:pass991@185.122.90.14:1080',
      label: 'SOCKS5 Resident #1 (RU - Москва)',
      country: 'RU',
      pingMs: 42,
      status: 'active',
      callsCount: 18,
    },
    {
      id: 'prx-2',
      url: 'socks5://tg_user2:pass992@194.87.14.92:1080',
      label: 'SOCKS5 Datacenter #2 (DE - Франкфурт)',
      country: 'DE',
      pingMs: 65,
      status: 'active',
      callsCount: 14,
    },
    {
      id: 'prx-3',
      url: 'socks5://tg_user3:pass993@45.133.1.20:1080',
      label: 'SOCKS5 Premium #3 (NL - Амстердам)',
      country: 'NL',
      pingMs: 58,
      status: 'active',
      callsCount: 7,
    },
  ],
  googleSheets: {
    webhookUrl: '',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
    sheetName: 'База_Позвонивших',
    autoSyncOnCallFinish: true,
    lastSyncTime: '2026-10-22 17:15',
    syncedCount: 5,
  },
  rvcConfig: {
    rawSshCommand: 'ssh -N -L 8888:127.0.0.1:9000 -L 8889:127.0.0.1:9001 -p 25411 root@194.168.1.10',
    serverIp: '194.168.1.10',
    sshPort: 25411,
    localRvcPort: 8889,
    remoteRvcPort: 9001,
    localVideoPort: 8888,
    remoteVideoPort: 9000,
    status: 'online',
    pingMs: 24,
    lastConnectedAt: '2026-10-22 18:05',
  },
  rvcSettings: {
    pitch: 0,
    indexRate: 0.75,
    protect: 0.33,
    activeVoiceId: 'voice_male_deep',
    isSwitching: false,
  },
  defaultRecordMode: 'FULL_CALL_MIX',
  clientStatuses: DEFAULT_CLIENT_STATUSES,
};

export class StorageService {
  private static get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(`teledial_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`teledial_${key}`, JSON.stringify(value));
    } catch {}
  }

  static getContacts(): Contact[] {
    return this.get<Contact[]>('contacts', INITIAL_CONTACTS);
  }

  static saveContacts(contacts: Contact[]): void {
    this.set('contacts', contacts);
  }

  static getHistory(): CallHistoryRecord[] {
    return this.get<CallHistoryRecord[]>('history', INITIAL_HISTORY);
  }

  static saveHistory(history: CallHistoryRecord[]): void {
    this.set('history', history);
  }

  static addHistoryRecord(record: CallHistoryRecord): void {
    const list = this.getHistory();
    this.saveHistory([record, ...list]);
  }

  static getAccounts(): TelegramAccount[] {
    return this.get<TelegramAccount[]>('accounts', INITIAL_ACCOUNTS);
  }

  static saveAccounts(accounts: TelegramAccount[]): void {
    this.set('accounts', accounts);
  }

  static getTemplates(): MessageTemplate[] {
    return this.get<MessageTemplate[]>('templates', INITIAL_TEMPLATES);
  }

  static saveTemplates(templates: MessageTemplate[]): void {
    this.set('templates', templates);
  }

  static getReminders(): CallReminder[] {
    return this.get<CallReminder[]>('reminders', INITIAL_REMINDERS);
  }

  static saveReminders(reminders: CallReminder[]): void {
    this.set('reminders', reminders);
  }

  static getInbox(): InboxEvent[] {
    return this.get<InboxEvent[]>('inbox', INITIAL_INBOX);
  }

  static saveInbox(inbox: InboxEvent[]): void {
    this.set('inbox', inbox);
  }

  static getSettings(): CRMSettings {
    const stored = this.get<Partial<CRMSettings>>('settings', INITIAL_SETTINGS);
    return {
      ...INITIAL_SETTINGS,
      ...(stored || {}),
      googleSheets: {
        ...INITIAL_SETTINGS.googleSheets,
        ...(stored?.googleSheets || {}),
      },
      rvcConfig: {
        ...INITIAL_SETTINGS.rvcConfig,
        ...(stored?.rvcConfig || {}),
      },
      rvcSettings: {
        ...INITIAL_SETTINGS.rvcSettings,
        ...(stored?.rvcSettings || {}),
      },
      proxies: stored?.proxies && stored.proxies.length > 0 ? stored.proxies : INITIAL_SETTINGS.proxies,
      defaultRecordMode: stored?.defaultRecordMode || INITIAL_SETTINGS.defaultRecordMode,
      clientStatuses: stored?.clientStatuses && stored.clientStatuses.length > 0
        ? stored.clientStatuses
        : DEFAULT_CLIENT_STATUSES,
    };
  }

  static saveSettings(settings: CRMSettings): void {
    this.set('settings', settings);
  }

  static resetToDefault(): void {
    try {
      localStorage.removeItem('teledial_contacts');
      localStorage.removeItem('teledial_history');
      localStorage.removeItem('teledial_accounts');
      localStorage.removeItem('teledial_templates');
      localStorage.removeItem('teledial_reminders');
      localStorage.removeItem('teledial_inbox');
      localStorage.removeItem('teledial_settings');
    } catch {}
  }
}

