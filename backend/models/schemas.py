from typing import Optional, List, Literal, Any
from pydantic import BaseModel, Field

# Core Enums & Literals
CallStatusType = Literal['idle', 'calling', 'connected', 'post_call']
LeadOutcomeType = Literal[
    'interested',
    'scheduled',
    'no_answer',
    'busy',
    'not_interested',
    'wrong_number',
    'success',
    'missed',
    'failed'
]
RecordModeType = Literal['CLIENT_ONLY', 'FULL_CALL_MIX', 'MULTI_TRACK_STEMS']
TemplateMediaType = Literal['none', 'image', 'video', 'audio', 'gif']
AccountStatusType = Literal['active', 'warming', 'paused', 'banned']

# Client Status / Group Definition
class ClientStatusDefinition(BaseModel):
    id: str
    label: str
    color: str = "amber"
    group: str
    description: Optional[str] = None
    isDefault: Optional[bool] = False

# Contact / Lead Model
class Contact(BaseModel):
    id: str
    target: str
    name: Optional[str] = None
    company: Optional[str] = None
    status: Literal['pending', 'in_progress', 'completed'] = 'pending'
    outcome: Optional[LeadOutcomeType] = None
    clientStatus: Optional[str] = None
    clientStatusId: Optional[str] = None
    clientStatusGroup: Optional[str] = None
    clientStatusColor: Optional[str] = None
    notes: Optional[str] = None
    lastCallDuration: Optional[int] = None
    lastCallAt: Optional[str] = None
    assignedAccount: Optional[str] = None

# Telegram Account Model
class TelegramAccount(BaseModel):
    id: str
    phone: str
    username: str
    displayName: str
    avatarColor: str = "bg-emerald-600"
    dailyCallLimit: int = 35
    callsToday: int = 0
    status: AccountStatusType = "active"
    proxy: str = ""
    sessionFile: Optional[str] = None

# Reminders
class CallReminder(BaseModel):
    id: str
    contactTarget: str
    contactName: str
    dateTime: str
    durationMinutes: int = 15
    notes: str = ""
    account: str = ""
    completed: bool = False

# Template Media Attachment
class TemplateMediaAttachment(BaseModel):
    type: TemplateMediaType = "none"
    url: str = ""
    name: str = ""
    sizeKb: Optional[int] = None
    previewUrl: Optional[str] = None

# Message Template
class MessageTemplate(BaseModel):
    id: str
    title: str
    content: str
    category: str = "Общие"
    mediaAttachment: Optional[TemplateMediaAttachment] = None

# Sent Message Info
class SentMessageInfo(BaseModel):
    sent: bool = False
    text: Optional[str] = None
    templateTitle: Optional[str] = None
    sentAt: Optional[str] = None
    mediaAttachment: Optional[TemplateMediaAttachment] = None

# Call History Record
class CallHistoryRecord(BaseModel):
    id: str
    dateTime: str
    target: str
    clientName: str
    company: Optional[str] = None
    outcome: str = "no_answer"
    clientStatus: Optional[str] = None
    clientStatusId: Optional[str] = None
    clientStatusGroup: Optional[str] = None
    clientStatusColor: Optional[str] = None
    durationSeconds: int = 0
    notes: str = ""
    message: SentMessageInfo = Field(default_factory=SentMessageInfo)
    accountUsed: str = ""
    proxyUsed: Optional[str] = None
    syncedToGoogleSheets: bool = False
    hasAudioRecord: Optional[bool] = False
    recordingId: Optional[str] = None

# Inbox Event
class InboxEvent(BaseModel):
    id: str
    type: Literal['message', 'missed_call'] = "message"
    client: str
    clientName: str
    account: str
    timestamp: str
    previewText: Optional[str] = None
    read: bool = False

# Saved Call Recording
class SavedCallRecording(BaseModel):
    id: str
    callId: str
    title: str
    clientTarget: str
    clientName: str
    dateTime: str
    durationSeconds: int
    mode: RecordModeType
    rvcVoiceName: str
    rvcPitch: int
    audioBlobUrl: Optional[str] = None
    fileSizeBytes: int = 0

# RVC Models
class RvcVoiceModel(BaseModel):
    id: str
    name: str
    gender: Literal['male', 'female', 'custom']
    tag: str
    recommendedPitch: int = 0
    description: str

class RvcSettings(BaseModel):
    pitch: int = 0
    indexRate: float = 0.75
    protect: float = 0.33
    activeVoiceId: str = "voice_male_deep"
    isSwitching: bool = False

class RvcConnectionConfig(BaseModel):
    rawSshCommand: str = ""
    serverIp: str = "127.0.0.1"
    sshPort: int = 22
    localRvcPort: int = 8889
    remoteRvcPort: int = 9001
    localVideoPort: int = 8888
    remoteVideoPort: int = 9000
    status: Literal['online', 'offline', 'connecting'] = "offline"
    pingMs: int = 0
    lastConnectedAt: Optional[str] = None

# Proxy
class ProxyServer(BaseModel):
    id: str
    url: str
    label: str
    country: str = "RU"
    pingMs: int = 40
    status: Literal['active', 'error'] = 'active'
    callsCount: int = 0

# Google Sheets Config
class GoogleSheetsConfig(BaseModel):
    webhookUrl: str = ""
    spreadsheetUrl: str = ""
    sheetName: str = "База_Позвонивших"
    autoSyncOnCallFinish: bool = True
    lastSyncTime: Optional[str] = None
    syncedCount: int = 0

class CRMSettings(BaseModel):
    dailyCallLimitPerAccount: int = 35
    autoRotateAccounts: bool = True
    autoNextCallDelaySeconds: int = 5
    soundEnabled: bool = True
    proxyRotationEnabled: bool = True
    currentProxyIndex: int = 0
    proxies: List[ProxyServer] = Field(default_factory=list)
    googleSheets: GoogleSheetsConfig = Field(default_factory=GoogleSheetsConfig)
    rvcConfig: RvcConnectionConfig = Field(default_factory=RvcConnectionConfig)
    rvcSettings: RvcSettings = Field(default_factory=RvcSettings)
    defaultRecordMode: RecordModeType = "FULL_CALL_MIX"
    clientStatuses: List[ClientStatusDefinition] = Field(default_factory=list)

# Requests / Payloads
class StartCallRequest(BaseModel):
    target: str
    account_id: str
    proxy_url: Optional[str] = None
    record_mode: Optional[RecordModeType] = "FULL_CALL_MIX"
    voice_id: Optional[str] = None
    pitch: Optional[int] = None

class HangupCallRequest(BaseModel):
    call_id: str

class SendMessageRequest(BaseModel):
    target: str
    text: str
    account_id: str
    template_title: Optional[str] = None
    media_attachment: Optional[TemplateMediaAttachment] = None

class SwitchVoiceRequest(BaseModel):
    voice_id: str
    pitch: Optional[int] = 0
    index_rate: Optional[float] = 0.75
    protect: Optional[float] = 0.33

class UpdateRvcParamsRequest(BaseModel):
    pitch: int = 0
    index_rate: float = 0.75
    protect: float = 0.33

class ParseSshRequest(BaseModel):
    command: str
