export type CallStatus = 'idle' | 'calling' | 'connected' | 'post_call';

export type LeadOutcome = 
  | 'interested'        // Заинтересован / Успех
  | 'scheduled'         // Договорились о созвоне
  | 'no_answer'         // Не ответил
  | 'busy'              // Занят / Сбросил
  | 'not_interested'    // Не актуально
  | 'wrong_number';     // Неверный номер / юзернейм

export interface ClientStatusDefinition {
  id: string;
  label: string;             // e.g. "отказался но на контакт идёт", "истеричка", "не ответил", "закрыты настройки"
  color: string;             // Tailwind color style key: "amber", "rose", "slate", "purple", "emerald", "sky", "orange", "indigo"
  group: string;             // Group/category for filtering and exporting: "Отказ (с шансом)", "Сложные клиенты", "Недозвон", "Приватность", etc.
  description?: string;
  isDefault?: boolean;
}

export interface Contact {
  id: string;
  target: string;        // Phone (+7 999 123-45-67) or Telegram handle (@username)
  name?: string;
  company?: string;
  status: 'pending' | 'in_progress' | 'completed';
  outcome?: LeadOutcome;
  clientStatus?: string;        // e.g. "отказался но на контакт идёт"
  clientStatusId?: string;
  clientStatusGroup?: string;
  clientStatusColor?: string;
  notes?: string;
  lastCallDuration?: number; // in seconds
  lastCallAt?: string;
  assignedAccount?: string;
}

export interface TelegramAccount {
  id: string;
  phone: string;
  username: string;
  displayName: string;
  avatarColor: string;
  dailyCallLimit: number;
  callsToday: number;
  status: 'active' | 'warming' | 'paused' | 'banned';
  proxy: string;
  sessionFile?: string;
}

export interface CallReminder {
  id: string;
  contactTarget: string;
  contactName: string;
  dateTime: string;       // ISO string e.g. "2026-10-23T14:00"
  durationMinutes: number;
  notes: string;
  account: string;
  completed: boolean;
}

export type TemplateMediaType = 'none' | 'image' | 'video' | 'audio' | 'gif';

export interface TemplateMediaAttachment {
  type: TemplateMediaType;
  url: string;                // URL or Base64 data URL
  name: string;               // Display title e.g. "Презентация.png", "голосовое.mp3"
  sizeKb?: number;
  previewUrl?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  mediaAttachment?: TemplateMediaAttachment;
}

export interface InboxEvent {
  id: string;
  type: 'message' | 'missed_call';
  client: string;          // e.g. "@mikhail_invest"
  clientName: string;
  account: string;         // e.g. "@tele_hunter_1"
  timestamp: string;
  previewText?: string;
  read: boolean;
}

export type AppTab = 'queue' | 'history' | 'rvc_studio' | 'recordings' | 'calendar' | 'accounts' | 'inbox';

export type RecordMode = 'CLIENT_ONLY' | 'FULL_CALL_MIX' | 'MULTI_TRACK_STEMS';

export interface RvcVoiceModel {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'custom';
  tag: string;
  recommendedPitch: number;
  description: string;
}

export interface RvcSettings {
  pitch: number;          // -12 to +12
  indexRate: number;      // 0.0 to 1.0
  protect: number;        // 0.0 to 0.5
  activeVoiceId: string;
  isSwitching: boolean;
}

export interface RvcConnectionConfig {
  rawSshCommand: string;
  serverIp: string;
  sshPort: number;
  localRvcPort: number;
  remoteRvcPort: number;
  localVideoPort: number;
  remoteVideoPort: number;
  status: 'online' | 'offline' | 'connecting';
  pingMs: number;
  lastConnectedAt?: string;
}

export interface SavedCallRecording {
  id: string;
  callId: string;
  title: string;
  clientTarget: string;
  clientName: string;
  dateTime: string;
  durationSeconds: number;
  mode: RecordMode;
  rvcVoiceName: string;
  rvcPitch: number;
  audioBlobUrl?: string;
  fileSizeBytes: number;
}

export interface ProxyServer {
  id: string;
  url: string;                // e.g. "socks5://user:pass@185.122.90.14:1080"
  label: string;              // e.g. "SOCKS5 Resident RU (185.122.90.14)"
  country: string;            // e.g. "RU", "DE", "NL"
  pingMs: number;
  status: 'active' | 'error';
  callsCount: number;
}

export interface SentMessageInfo {
  sent: boolean;
  text?: string;
  templateTitle?: string;
  sentAt?: string;
  mediaAttachment?: TemplateMediaAttachment;
}

export interface CallHistoryRecord {
  id: string;
  dateTime: string;            // ISO or formatted: "2026-10-22 17:35:10"
  target: string;              // Client phone number or Telegram handle
  clientName: string;
  company?: string;
  outcome: LeadOutcome | 'success' | 'missed' | 'failed' | string;
  clientStatus?: string;       // Custom status e.g. "отказался но на контакт идёт"
  clientStatusId?: string;
  clientStatusGroup?: string;  // Group e.g. "Отказ (с шансом)"
  clientStatusColor?: string;  // Color tag
  durationSeconds: number;
  notes: string;               // Comment left after call
  message: SentMessageInfo;    // Info about sent message
  accountUsed: string;         // e.g. "@hunter_sales_1"
  proxyUsed?: string;          // e.g. "SOCKS5 #1 (185.122.90.14:1080 RU)"
  syncedToGoogleSheets: boolean;
  hasAudioRecord?: boolean;
  recordingId?: string;
}

export interface GoogleSheetsConfig {
  webhookUrl: string;          // Google Apps Script Webhook URL for live auto-append
  spreadsheetUrl: string;      // Google Sheets URL
  sheetName: string;           // Tab name e.g. "База_Позвонивших"
  autoSyncOnCallFinish: boolean; // Auto-append row to Google Sheets on call finish
  lastSyncTime?: string;
  syncedCount: number;
}

export interface CRMSettings {
  dailyCallLimitPerAccount: number;
  autoRotateAccounts: boolean;
  autoNextCallDelaySeconds: number;
  soundEnabled: boolean;
  proxyRotationEnabled: boolean;
  currentProxyIndex: number;
  proxies: ProxyServer[];
  googleSheets: GoogleSheetsConfig;
  rvcConfig: RvcConnectionConfig;
  rvcSettings: RvcSettings;
  defaultRecordMode: RecordMode;
  clientStatuses: ClientStatusDefinition[];
}



