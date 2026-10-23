import React, { useState, useEffect } from 'react';
import { 
  Contact, 
  TelegramAccount, 
  CallReminder, 
  MessageTemplate, 
  InboxEvent, 
  CRMSettings, 
  LeadOutcome,
  CallHistoryRecord,
  AppTab,
  RvcVoiceModel,
  RecordMode,
  SavedCallRecording,
  RvcConnectionConfig,
  RvcSettings,
  TemplateMediaAttachment
} from './types';
import { StorageService } from './services/storage';
import { api } from './services/api';
import { GoogleSheetsService } from './services/googleSheetsService';
import { RvcService, INITIAL_RVC_VOICES } from './services/rvcService';
import { RecorderService } from './services/recorderService';
import { Header } from './components/Header';
import { QueuePanel } from './components/QueuePanel';
import { CallHistoryView } from './components/CallHistoryView';
import { ActiveCallModal } from './components/ActiveCallModal';
import { PostCallModal } from './components/PostCallModal';
import { CalendarView } from './components/CalendarView';
import { AccountsSettings } from './components/AccountsSettings';
import { InboxDrawer } from './components/InboxDrawer';
import { NewTemplateModal } from './components/NewTemplateModal';
import { ExportModal } from './components/ExportModal';
import { MobileNav } from './components/MobileNav';
import { RvcStudioView } from './components/RvcStudioView';
import { RecordingsView } from './components/RecordingsView';
import { FloatingOverlay } from './components/FloatingOverlay';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<AppTab>('queue');

  // Core Data States
  const [contacts, setContacts] = useState<Contact[]>(() => StorageService.getContacts());
  const [history, setHistory] = useState<CallHistoryRecord[]>(() => StorageService.getHistory());
  const [accounts, setAccounts] = useState<TelegramAccount[]>(() => StorageService.getAccounts());
  const [activeAccountId, setActiveAccountId] = useState<string>(() => StorageService.getAccounts()[0]?.id || '');
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => StorageService.getTemplates());
  const [reminders, setReminders] = useState<CallReminder[]>(() => StorageService.getReminders());
  const [inbox, setInbox] = useState<InboxEvent[]>(() => StorageService.getInbox());
  const [settings, setSettings] = useState<CRMSettings>(() => StorageService.getSettings());

  // RVC & Voice Models State
  const [voices, setVoices] = useState<RvcVoiceModel[]>(INITIAL_RVC_VOICES);

  // Call Recorder States
  const [recordings, setRecordings] = useState<SavedCallRecording[]>(() => RecorderService.getRecordings());
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [recordMode, setRecordMode] = useState<RecordMode>(() => settings.defaultRecordMode || 'FULL_CALL_MIX');
  const [lastFinishedRecordingId, setLastFinishedRecordingId] = useState<string | null>(null);

  // Floating Overlay State
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);

  // Active Call & Post Call States
  const [currentCallContact, setCurrentCallContact] = useState<Contact | null>(null);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [currentProxyUsed, setCurrentProxyUsed] = useState<string>('');
  const [postCallData, setPostCallData] = useState<{
    contact: Contact;
    account: TelegramAccount;
    proxyUsed: string;
    duration: number;
    recordingId?: string;
  } | null>(null);

  // Modals
  const [showNewTemplateModal, setShowNewTemplateModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Active account getter
  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0] || null;

  // Persist state updates to local storage
  useEffect(() => {
    StorageService.saveContacts(contacts);
  }, [contacts]);

  useEffect(() => {
    StorageService.saveHistory(history);
  }, [history]);

  useEffect(() => {
    StorageService.saveAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    StorageService.saveTemplates(templates);
  }, [templates]);

  useEffect(() => {
    StorageService.saveReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    StorageService.saveInbox(inbox);
  }, [inbox]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  // Recorder timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Account rotation logic
  const getNextAvailableAccount = (): TelegramAccount => {
    if (!settings.autoRotateAccounts || accounts.length <= 1) {
      return activeAccount || accounts[0];
    }
    const eligible = accounts.filter((a) => a.callsToday < a.dailyCallLimit && a.status === 'active');
    if (eligible.length > 0) {
      return eligible.sort((a, b) => a.callsToday - b.callsToday)[0];
    }
    return activeAccount || accounts[0];
  };

  // 1. Start Next Call from Queue
  const handleStartNextCall = () => {
    const pending = contacts.filter((c) => c.status === 'pending');
    if (pending.length === 0) return;
    const targetContact = pending[0];
    initiateCall(targetContact);
  };

  // 2. Call specific contact with ROUND-ROBIN PROXY ROTATION
  const initiateCall = (contact: Contact) => {
    const callingAccount = getNextAvailableAccount();
    
    // Rotate proxy in round-robin cycle: "Кожна зміна акаунту для дзвінків - зміна проксі, навіть якщо їх всього 2, по кругу"
    const proxies = settings.proxies || [];
    let proxyLabel = callingAccount.proxy;

    if (proxies.length > 0 && settings.proxyRotationEnabled) {
      const pIdx = (settings.currentProxyIndex || 0) % proxies.length;
      const selectedPrx = proxies[pIdx];
      proxyLabel = `${selectedPrx.label} [${selectedPrx.country}]`;

      // Advance round-robin index to next proxy in cycle
      const nextIdx = (pIdx + 1) % proxies.length;
      
      // Update proxy calls counter
      const updatedProxies = proxies.map((p, idx) =>
        idx === pIdx ? { ...p, callsCount: p.callsCount + 1 } : p
      );

      setSettings((prev) => ({
        ...prev,
        currentProxyIndex: nextIdx,
        proxies: updatedProxies,
      }));
    }

    // Increment calls count on account
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === callingAccount.id ? { ...acc, callsToday: acc.callsToday + 1, proxy: proxyLabel } : acc
      )
    );

    setCurrentProxyUsed(proxyLabel);
    setCurrentCallContact(contact);
    setIsCalling(true);
    setLastFinishedRecordingId(null);
  };

  // Toggle call recording
  const handleToggleRecord = () => {
    if (isRecording) {
      const saved = RecorderService.stopRecording();
      setIsRecording(false);
      if (saved) {
        setRecordings((prev) => [saved, ...prev]);
        setLastFinishedRecordingId(saved.id);
      }
    } else {
      const activeVoice = voices.find((v) => v.id === settings.rvcSettings?.activeVoiceId);
      RecorderService.startRecording(recordMode, {
        callId: `call-${Date.now()}`,
        clientTarget: currentCallContact?.target || 'Unknown',
        clientName: currentCallContact?.name || currentCallContact?.target || 'Новый клиент',
        rvcVoice: activeVoice?.name || 'Male_Deep',
        pitch: settings.rvcSettings?.pitch ?? 0,
      });
      setIsRecording(true);
    }
  };

  // 3. Hang up active call -> Transitions to Post-Call Modal
  const handleEndCall = (durationSeconds: number) => {
    if (!currentCallContact) return;
    const callingAccount = getNextAvailableAccount();

    let recordedId = lastFinishedRecordingId || undefined;
    if (isRecording) {
      const saved = RecorderService.stopRecording();
      setIsRecording(false);
      if (saved) {
        setRecordings((prev) => [saved, ...prev]);
        recordedId = saved.id;
      }
    }

    setIsCalling(false);
    setPostCallData({
      contact: currentCallContact,
      account: callingAccount,
      proxyUsed: currentProxyUsed,
      duration: durationSeconds,
      recordingId: recordedId,
    });
    setCurrentCallContact(null);
  };

  // 4. Save Post-Call data & automatically add to Call History and Google Sheets
  const handleSavePostCall = async (data: {
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
  }) => {
    if (!postCallData) return;
    const { contact, account, duration, proxyUsed, recordingId } = postCallData;

    // Map outcome to user-friendly status
    let outcomeText = 'успешно';
    if (data.outcome === 'interested') outcomeText = 'успешно (заинтересован)';
    else if (data.outcome === 'scheduled') outcomeText = 'успешно (созвон)';
    else if (data.outcome === 'no_answer') outcomeText = 'пропущен';
    else if (data.outcome === 'busy') outcomeText = 'не удалось (сбросил)';
    else if (data.outcome === 'not_interested') outcomeText = 'не удалось (отказ)';
    else if (data.outcome === 'wrong_number') outcomeText = 'не удалось (неверный номер)';

    // Create history item
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newHistoryRecord: CallHistoryRecord = {
      id: `hist-${Date.now()}`,
      dateTime: formattedDate,
      target: contact.target,
      clientName: contact.name || contact.target,
      company: contact.company,
      outcome: outcomeText,
      clientStatus: data.clientStatus || 'Без статуса',
      clientStatusId: data.clientStatusId,
      clientStatusGroup: data.clientStatusGroup || 'Общее',
      clientStatusColor: data.clientStatusColor || 'amber',
      durationSeconds: duration,
      notes: data.notes || '',
      message: {
        sent: data.messageSent?.sent || false,
        text: data.messageSent?.text || '',
        templateTitle: data.messageSent?.templateTitle || '',
        sentAt: data.messageSent?.sent ? formattedDate : undefined,
        mediaAttachment: data.messageSent?.mediaAttachment,
      },
      accountUsed: account.username,
      proxyUsed: proxyUsed || account.proxy,
      syncedToGoogleSheets: settings.googleSheets.autoSyncOnCallFinish,
      hasAudioRecord: Boolean(recordingId || duration > 10),
      recordingId: recordingId,
    };

    // Prepend to Call History
    setHistory((prev) => [newHistoryRecord, ...prev]);

    // Live sync to Google Sheets if auto-sync is active
    if (settings.googleSheets.autoSyncOnCallFinish) {
      GoogleSheetsService.syncRecordToSheet(newHistoryRecord, settings.googleSheets)
        .then(() => {
          setSettings((prev) => ({
            ...prev,
            googleSheets: {
              ...prev.googleSheets,
              syncedCount: prev.googleSheets.syncedCount + 1,
              lastSyncTime: new Date().toLocaleTimeString('ru-RU'),
            },
          }));
        })
        .catch(console.error);
    }

    // Update contact status
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contact.id
          ? {
              ...c,
              status: 'completed',
              outcome: data.outcome,
              clientStatus: data.clientStatus,
              clientStatusId: data.clientStatusId,
              clientStatusGroup: data.clientStatusGroup,
              clientStatusColor: data.clientStatusColor,
              notes: data.notes,
              lastCallDuration: duration,
              lastCallAt: formattedDate,
              assignedAccount: account.username,
            }
          : c
      )
    );

    // Save reminder to Calendar if set
    if (data.reminderDateTime) {
      const newReminder: CallReminder = {
        id: `rem-${Date.now()}`,
        contactTarget: contact.target,
        contactName: contact.name || contact.target,
        dateTime: data.reminderDateTime,
        durationMinutes: 15,
        notes: data.notes || 'Повторный звонок',
        account: account.username,
        completed: false,
      };
      setReminders((prev) => [...prev, newReminder]);
    }

    // Close modal
    setPostCallData(null);

    // Auto-call next if requested
    if (data.callNextImmediately) {
      setTimeout(() => {
        handleStartNextCall();
      }, 500);
    }
  };

  // Sync all history to Google Sheets
  const handleSyncAllToSheets = async () => {
    const unsynced = history.filter((h) => !h.syncedToGoogleSheets);
    if (unsynced.length === 0) return;

    for (const item of unsynced) {
      await GoogleSheetsService.syncRecordToSheet(item, settings.googleSheets);
    }

    setHistory((prev) =>
      prev.map((h) => ({ ...h, syncedToGoogleSheets: true }))
    );

    setSettings((prev) => ({
      ...prev,
      googleSheets: {
        ...prev.googleSheets,
        syncedCount: prev.googleSheets.syncedCount + unsynced.length,
        lastSyncTime: new Date().toLocaleTimeString('ru-RU'),
      },
    }));
  };

  // Inbox Handlers
  const handleMarkInboxRead = (id: string) => {
    setInbox((prev) => prev.map((ev) => (ev.id === id ? { ...ev, read: true } : ev)));
  };

  const handleCallFromAnywhere = (target: string, name?: string) => {
    let existing = contacts.find((c) => c.target === target);
    if (!existing) {
      existing = {
        id: `c-${Date.now()}`,
        target,
        name: name || target,
        status: 'pending',
      };
      setContacts((prev) => [existing!, ...prev]);
    }
    initiateCall(existing);
  };

  const handleReplyFromInbox = async (clientTarget: string, text: string) => {
    await api.sendMessage(clientTarget, text, activeAccount?.username || '@tele_hunter_1');
    const ev: InboxEvent = {
      id: `ev-${Date.now()}`,
      type: 'message',
      client: clientTarget,
      clientName: clientTarget,
      account: activeAccount?.username || '@tele_hunter_1',
      timestamp: 'Только что',
      previewText: `Вы: ${text}`,
      read: true,
    };
    setInbox((prev) => [ev, ...prev]);
  };

  const handleAddMockInboxEvent = () => {
    const mockTargets = ['@artem_crypto', '+7 916 234-99-11', '@sofia_lead', '+7 903 555-44-33'];
    const mockNames = ['Артем Криптович', 'ИП Кузнецов', 'София HR', 'Виктор Недвижимость'];
    const randomIdx = Math.floor(Math.random() * mockTargets.length);
    const isMissed = Math.random() > 0.5;

    const newEvent: InboxEvent = {
      id: `mock-${Date.now()}`,
      type: isMissed ? 'missed_call' : 'message',
      client: mockTargets[randomIdx],
      clientName: mockNames[randomIdx],
      account: activeAccount?.username || '@tele_hunter_1',
      timestamp: 'Только что',
      previewText: isMissed ? 'Пропущенный звонок в Telegram' : 'Здравствуйте! Перезвоните, пожалуйста, обсудим КП.',
      read: false,
    };

    setInbox((prev) => [newEvent, ...prev]);
  };

  // Calendar handlers
  const handleAddReminder = (reminder: Omit<CallReminder, 'id' | 'completed'>) => {
    const newRem: CallReminder = {
      ...reminder,
      id: `rem-${Date.now()}`,
      completed: false,
    };
    setReminders((prev) => [...prev, newRem]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Template handlers
  const handleAddTemplate = (tpl: MessageTemplate) => {
    setTemplates((prev) => {
      const updated = [...prev, tpl];
      StorageService.saveTemplates(updated);
      return updated;
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      StorageService.saveTemplates(updated);
      return updated;
    });
  };

  // Account file upload handler
  const handleUploadAccountFile = async (file: File, dailyLimit: number): Promise<void> => {
    const newAcc = await api.uploadAccountFile(file, dailyLimit);
    setAccounts((prev) => [...prev, newAcc]);
  };

  // RVC & Voice handlers
  const handleUpdateRvcConfig = (newConfig: RvcConnectionConfig) => {
    setSettings((prev) => ({
      ...prev,
      rvcConfig: newConfig,
    }));
  };

  const handleUpdateRvcSettings = (newRvcSettings: RvcSettings) => {
    setSettings((prev) => ({
      ...prev,
      rvcSettings: newRvcSettings,
    }));
  };

  const handleRefreshVoices = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setVoices([...INITIAL_RVC_VOICES]);
  };

  // Delete recording handler
  const handleDeleteRecording = (id: string) => {
    RecorderService.deleteRecording(id);
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const unreadInboxCount = inbox.filter((e) => !e.read).length;

  return (
    <div className="min-h-screen bg-[#070c14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Universal Desktop & Tablet Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadInboxCount={unreadInboxCount}
        historyCount={history.length}
        recordingsCount={recordings.length}
        activeAccount={activeAccount}
        rvcConfig={settings.rvcConfig}
        onOpenExportModal={() => setShowExportModal(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        
        {activeTab === 'queue' && (
          <QueuePanel
            contacts={contacts}
            onUpdateContacts={setContacts}
            onStartNextCall={handleStartNextCall}
            onCallSpecificContact={initiateCall}
            activeAccount={activeAccount}
          />
        )}

        {activeTab === 'rvc_studio' && (
          <RvcStudioView
            rvcConfig={settings.rvcConfig}
            onUpdateRvcConfig={handleUpdateRvcConfig}
            rvcSettings={settings.rvcSettings}
            onUpdateRvcSettings={handleUpdateRvcSettings}
            voices={voices}
            onRefreshVoices={handleRefreshVoices}
          />
        )}

        {activeTab === 'recordings' && (
          <RecordingsView
            recordings={recordings}
            onDeleteRecording={handleDeleteRecording}
          />
        )}

        {activeTab === 'history' && (
          <CallHistoryView
            history={history}
            onRedialContact={handleCallFromAnywhere}
            sheetsConfig={settings.googleSheets}
            onUpdateSheetsConfig={(cfg) => setSettings({ ...settings, googleSheets: cfg })}
            onSyncAllToSheets={handleSyncAllToSheets}
            clientStatuses={settings.clientStatuses}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onDeleteReminder={handleDeleteReminder}
            onCallContact={handleCallFromAnywhere}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsSettings
            accounts={accounts}
            activeAccount={activeAccount}
            onSetActiveAccount={(acc) => setActiveAccountId(acc.id)}
            onUploadAccountFile={handleUploadAccountFile}
            onDeleteAccount={(id) => setAccounts((prev) => prev.filter((a) => a.id !== id))}
            settings={settings}
            onUpdateSettings={setSettings}
            templates={templates}
            onOpenNewTemplateModal={() => setShowNewTemplateModal(true)}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}

        {activeTab === 'inbox' && (
          <InboxDrawer
            events={inbox}
            onMarkRead={handleMarkInboxRead}
            onCallClient={handleCallFromAnywhere}
            onReplyMessage={handleReplyFromInbox}
            onAddMockEvent={handleAddMockInboxEvent}
          />
        )}
      </main>

      {/* Active Call Modal Overlay */}
      {isCalling && currentCallContact && activeAccount && (
        <ActiveCallModal
          contact={currentCallContact}
          account={activeAccount}
          proxyUsed={currentProxyUsed}
          onEndCall={handleEndCall}
          rvcSettings={settings.rvcSettings}
          onUpdateRvcSettings={handleUpdateRvcSettings}
          voices={voices}
          isRecording={isRecording}
          recordDuration={recordDuration}
          recordMode={recordMode}
          onChangeRecordMode={(m) => {
            setRecordMode(m);
            setSettings((prev) => ({ ...prev, defaultRecordMode: m }));
          }}
          onToggleRecord={handleToggleRecord}
          onToggleOverlay={() => setIsOverlayOpen((prev) => !prev)}
        />
      )}

      {/* Floating Overlay for Call & RVC / REC controls */}
      <FloatingOverlay
        isOpen={isOverlayOpen || (isCalling && isOverlayOpen)}
        onClose={() => setIsOverlayOpen(false)}
        rvcSettings={settings.rvcSettings}
        onUpdateRvcSettings={handleUpdateRvcSettings}
        voices={voices}
        isRecording={isRecording}
        recordDuration={recordDuration}
        recordMode={recordMode}
        onChangeRecordMode={(m) => {
          setRecordMode(m);
          setSettings((prev) => ({ ...prev, defaultRecordMode: m }));
        }}
        onToggleRecord={handleToggleRecord}
        clientName={currentCallContact?.name || currentCallContact?.target}
      />

      {/* Post-Call Modal Overlay */}
      {postCallData && (
        <PostCallModal
          contact={postCallData.contact}
          account={postCallData.account}
          durationSeconds={postCallData.duration}
          templates={templates}
          clientStatuses={settings.clientStatuses}
          onOpenNewTemplateModal={() => setShowNewTemplateModal(true)}
          onDeleteTemplate={handleDeleteTemplate}
          onSaveAndNext={handleSavePostCall}
          onClose={() => setPostCallData(null)}
        />
      )}

      {/* Modal: New Template */}
      {showNewTemplateModal && (
        <NewTemplateModal
          onAddTemplate={handleAddTemplate}
          onClose={() => setShowNewTemplateModal(false)}
        />
      )}

      {/* Modal: Export ZIP Project */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      {/* Mobile Ergonomic Bottom Tab Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadInboxCount={unreadInboxCount}
        recordingsCount={recordings.length}
      />

    </div>
  );
}
