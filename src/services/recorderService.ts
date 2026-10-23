import { RecordMode, SavedCallRecording } from '../types';
import { api } from './api';

export class RecorderService {
  private static isRecording = false;
  private static recordStartTime = 0;
  private static currentMode: RecordMode = 'FULL_CALL_MIX';
  private static currentCallMeta: {
    callId: string;
    clientTarget: string;
    clientName: string;
    rvcVoice: string;
    pitch: number;
  } | null = null;

  static startRecording(
    mode: RecordMode,
    callMeta: {
      callId: string;
      clientTarget: string;
      clientName: string;
      rvcVoice: string;
      pitch: number;
    }
  ): void {
    this.isRecording = true;
    this.recordStartTime = Date.now();
    this.currentMode = mode;
    this.currentCallMeta = callMeta;
  }

  static isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  static getCurrentRecordDurationSeconds(): number {
    if (!this.isRecording) return 0;
    return Math.floor((Date.now() - this.recordStartTime) / 1000);
  }

  static stopRecording(): SavedCallRecording | null {
    if (!this.isRecording || !this.currentCallMeta) return null;

    const duration = Math.max(1, Math.floor((Date.now() - this.recordStartTime) / 1000));
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRec: SavedCallRecording = {
      id: `rec-${Date.now()}`,
      callId: this.currentCallMeta.callId,
      title: `Запись: ${this.currentCallMeta.clientName || this.currentCallMeta.clientTarget}`,
      clientTarget: this.currentCallMeta.clientTarget,
      clientName: this.currentCallMeta.clientName,
      dateTime: formattedDate,
      durationSeconds: duration,
      mode: this.currentMode,
      rvcVoiceName: this.currentCallMeta.rvcVoice,
      rvcPitch: this.currentCallMeta.pitch,
      fileSizeBytes: duration * 32000, // Approximate 32KB/sec Opus/PCM
    };

    this.isRecording = false;
    this.currentCallMeta = null;
    this.recordStartTime = 0;

    // Save to storage
    const list = this.getRecordings();
    this.saveRecordings([newRec, ...list]);

    return newRec;
  }

  static getRecordings(): SavedCallRecording[] {
    try {
      const item = localStorage.getItem('teledial_recordings');
      if (item) return JSON.parse(item);
    } catch {}

    // Default sample recordings
    return [
      {
        id: 'rec-demo-1',
        callId: 'call-101',
        title: 'Запись звонка: Алексей Смирнов (FinTech Cloud)',
        clientTarget: '+79261234567',
        clientName: 'Алексей Смирнов',
        dateTime: '2026-10-22 16:45',
        durationSeconds: 142,
        mode: 'FULL_CALL_MIX',
        rvcVoiceName: 'Male_Deep (Баритон)',
        rvcPitch: -4,
        fileSizeBytes: 4544000,
      },
      {
        id: 'rec-demo-2',
        callId: 'call-102',
        title: 'Запись: Михаил Соколов (Retail Hub)',
        clientTarget: '+79165554321',
        clientName: 'Михаил Соколов',
        dateTime: '2026-10-22 15:50',
        durationSeconds: 215,
        mode: 'MULTI_TRACK_STEMS',
        rvcVoiceName: 'Executive_Alpha',
        rvcPitch: -2,
        fileSizeBytes: 6880000,
      },
      {
        id: 'rec-demo-3',
        callId: 'call-103',
        title: 'Запись: Елена Васильева (ИнвестКапитал)',
        clientTarget: '+79037778899',
        clientName: 'Елена Васильева',
        dateTime: '2026-10-22 14:20',
        durationSeconds: 98,
        mode: 'CLIENT_ONLY',
        rvcVoiceName: 'Female_Soft',
        rvcPitch: +6,
        fileSizeBytes: 3136000,
      },
    ];
  }

  static saveRecordings(list: SavedCallRecording[]): void {
    try {
      localStorage.setItem('teledial_recordings', JSON.stringify(list));
    } catch {}
  }

  static deleteRecording(id: string): void {
    api.deleteRecording(id).catch(() => {});
    const list = this.getRecordings().filter((r) => r.id !== id);
    this.saveRecordings(list);
  }
}
