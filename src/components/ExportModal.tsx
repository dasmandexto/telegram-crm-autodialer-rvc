import React, { useState } from 'react';
import { Download, X, CheckCircle2, Terminal, Code2, Server, FileArchive } from 'lucide-react';
import { generateProjectZip, downloadBlob } from '../services/zipExporter';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const blob = await generateProjectZip();
      downloadBlob(blob, 'teledial-crm-telegram-calling.zip');
      setDownloaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0f172a] border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Экспорт ZIP-архива проекта
              </h3>
              <p className="text-xs text-slate-400">
                Готовый код для подключения к бэкенду (Python / Telethon или Node.js)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & instructions */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" />
              Что включено в ZIP-архив:
            </h4>
            <ul className="space-y-1 list-disc list-inside text-slate-400">
              <li>Полный исходный код фронтенда (React + TypeScript + Tailwind CSS)</li>
              <li>Все экраны: Очередь, Активный звонок, Пост-вызов, Календарь, Аккаунты, Инбокс</li>
              <li>Синтезатор звуков Web Audio API (гудки, соединение, отбой)</li>
              <li>Готовый шаблон бэкенда на Python (FastAPI + Telethon для звонков Telegram)</li>
              <li>Файл конфигурации API и документация по интеграции</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#0b101b] border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-slate-500">// Быстрое подключение к вашему бэкенду:</div>
            <div>1. Распакуйте архив в рабочую директорию</div>
            <div>2. В <span className="text-emerald-400">src/services/api.ts</span> укажите:</div>
            <div className="text-emerald-300 pl-2">USE_REAL_BACKEND = true</div>
            <div className="text-emerald-300 pl-2">BASE_URL = 'http://localhost:8000/api'</div>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-500">
            Формат: .zip, готов к развертыванию
          </span>

          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            {isExporting ? (
              <span>Архивация файлов...</span>
            ) : downloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Скачать архив повторно</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Скачать ZIP-архив</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
