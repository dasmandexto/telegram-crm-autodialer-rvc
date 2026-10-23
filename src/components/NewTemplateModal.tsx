import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Sparkles, 
  Dices, 
  Image, 
  Video, 
  Mic, 
  Film, 
  Trash2, 
  UploadCloud, 
  Check, 
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { MessageTemplate, TemplateMediaType, TemplateMediaAttachment } from '../types';
import { SpintaxService } from '../services/spintax';

interface NewTemplateModalProps {
  onAddTemplate: (tpl: MessageTemplate) => void;
  onClose: () => void;
}

const MEDIA_PRESETS: Record<TemplateMediaType, { name: string; url: string; sizeKb: number } | null> = {
  none: null,
  image: {
    name: 'КП_Тарифы_и_Кейсы.png',
    url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
    sizeKb: 320,
  },
  audio: {
    name: 'Голосовое_пояснение_менеджера.mp3',
    url: 'https://actions.google.com/sounds/v1/ambient/rain_heavy.ogg',
    sizeKb: 210,
  },
  video: {
    name: 'Видеодемо_возможностей_TeleDial.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    sizeKb: 1420,
  },
  gif: {
    name: 'Приветственная_анимация.gif',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1aHk3Zjh3b2V1ZjlhNHlhZDF2OG10ZXd5eGttOTRraDJ6cWphdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/giphy.gif',
    sizeKb: 430,
  },
};

export const NewTemplateModal: React.FC<NewTemplateModalProps> = ({
  onAddTemplate,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Пост-звонок');
  const [content, setContent] = useState('');
  const [spintaxTestResult, setSpintaxTestResult] = useState<string | null>(null);

  // Media attachment state
  const [selectedMediaType, setSelectedMediaType] = useState<TemplateMediaType>('none');
  const [mediaAttachment, setMediaAttachment] = useState<TemplateMediaAttachment | undefined>(undefined);
  const [customMediaUrl, setCustomMediaUrl] = useState<string>('');
  const [customMediaName, setCustomMediaName] = useState<string>('');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const spintaxBlocks = SpintaxService.countBlocks(content);
  const spintaxCombinations = SpintaxService.countCombinations(content);

  const handleTestSpintax = () => {
    if (!content.trim()) return;
    const sample = SpintaxService.spin(content)
      .replace('{имя}', 'Алексей')
      .replace('{время}', 'завтра в 14:00')
      .replace('{id}', '4819');
    setSpintaxTestResult(sample);
  };

  const handleSelectMediaType = (type: TemplateMediaType) => {
    setSelectedMediaType(type);
    if (type === 'none') {
      setMediaAttachment(undefined);
      setCustomMediaUrl('');
      setCustomMediaName('');
    } else {
      const preset = MEDIA_PRESETS[type];
      if (preset) {
        setMediaAttachment({
          type,
          url: preset.url,
          name: preset.name,
          sizeKb: preset.sizeKb,
        });
        setCustomMediaUrl(preset.url);
        setCustomMediaName(preset.name);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const sizeKb = Math.round(file.size / 1024);
      let type: TemplateMediaType = 'image';
      if (file.type.startsWith('image/gif') || file.name.endsWith('.gif')) {
        type = 'gif';
      } else if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }

      setSelectedMediaType(type);
      setMediaAttachment({
        type,
        url: result,
        name: file.name,
        sizeKb,
      });
      setCustomMediaName(file.name);
      setUploadFeedback(`Файл ${file.name} (${sizeKb} КБ) успешно загружен!`);
      setTimeout(() => setUploadFeedback(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    let finalAttachment: TemplateMediaAttachment | undefined = undefined;
    if (selectedMediaType !== 'none') {
      finalAttachment = mediaAttachment || {
        type: selectedMediaType,
        url: customMediaUrl.trim() || MEDIA_PRESETS[selectedMediaType]?.url || '',
        name: customMediaName.trim() || `${selectedMediaType}_attachment`,
      };
    }

    const newTpl: MessageTemplate = {
      id: `tpl-${Date.now()}`,
      title: title.trim(),
      category: category.trim() || 'Общие',
      content: content.trim(),
      mediaAttachment: finalAttachment,
    };

    onAddTemplate(newTpl);
    onClose();
  };

  const insertVariable = (varName: string) => {
    setContent((prev) => `${prev}${varName}`);
  };

  const insertSpintaxSample = () => {
    setContent((prev) => `${prev}{Здравствуйте|Добрый день|Приветствую}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0f172a] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Создать шаблон с поддержкой Спинтакса и Медиа
              </h3>
              <p className="text-[11px] text-slate-400">
                Вариативность текстов против антиспама + отправка аудио, видео, фото и GIF
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Название шаблона *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: КП с прайсом и видео"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Категория
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Пост-звонок, Дозвон, Встречи..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Text with Spintax tools */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <span>Текст сообщения (поддерживает Спинтакс) *</span>
              </label>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                <span className="hidden sm:inline">Вставка:</span>
                <button
                  type="button"
                  onClick={() => insertVariable('{имя}')}
                  className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 hover:bg-slate-700 font-mono text-[10px]"
                >
                  {'{имя}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{время}')}
                  className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 hover:bg-slate-700 font-mono text-[10px]"
                >
                  {'{время}'}
                </button>
                <button
                  type="button"
                  onClick={insertSpintaxSample}
                  className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/40 hover:bg-amber-900/80 text-[10px] font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  +Спинтакс {'{а|б}'}
                </button>
              </div>
            </div>

            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSpintaxTestResult(null);
              }}
              placeholder="{Здравствуйте|Добрый день}, {имя}! {Договорились на созвоне|Как и обсуждали во время звонка}... {Буду рад ответить|С уважением}!"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />

            {/* Spintax statistics and live tester */}
            <div className="mt-2 flex items-center justify-between flex-wrap gap-2 text-[11px]">
              <div className="flex items-center gap-2 text-slate-400">
                {spintaxBlocks > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-700/50 flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Блоков спинтакса: {spintaxBlocks} (до {spintaxCombinations} вариантов)
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Используйте фигурные скобки <code className="text-amber-300 font-mono">{'{вар1|вар2}'}</code> для антиспам-рандомизации.
                  </span>
                )}
              </div>

              {spintaxBlocks > 0 && (
                <button
                  type="button"
                  onClick={handleTestSpintax}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 font-semibold active:scale-95 transition-all"
                >
                  <Dices className="w-3.5 h-3.5 text-amber-400" />
                  <span>Проверить рандом</span>
                </button>
              )}
            </div>

            {/* Live Spintax result preview */}
            {spintaxTestResult && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-xs animate-fadeIn">
                <div className="flex items-center justify-between text-[10px] text-amber-400 uppercase font-semibold mb-1">
                  <span>Сгенерированный случайный вариант:</span>
                  <span className="text-slate-500">готово к отправке</span>
                </div>
                <p className="text-slate-200 whitespace-pre-line font-sans">{spintaxTestResult}</p>
              </div>
            )}
          </div>

          {/* Media Attachments Section (Аудио / Фото / Видео / GIF) */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-sky-400" />
                Медиа-вложение к сообщению (Аудио, Фото, Видео, GIF)
              </label>
              {selectedMediaType !== 'none' && (
                <button
                  type="button"
                  onClick={() => handleSelectMediaType('none')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Удалить медиа
                </button>
              )}
            </div>

            {/* Media Type Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { type: 'none' as const, label: 'Без медиа', icon: X },
                { type: 'image' as const, label: 'Фото / Картинка', icon: Image },
                { type: 'audio' as const, label: 'Аудио / Голосовое', icon: Mic },
                { type: 'video' as const, label: 'Видеоролик', icon: Video },
                { type: 'gif' as const, label: 'GIF-анимация', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedMediaType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleSelectMediaType(item.type)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-sky-950/60 border-sky-500 text-sky-300 ring-1 ring-sky-400/40 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Media Attachment Preview & Controls */}
            {selectedMediaType !== 'none' && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {selectedMediaType.toUpperCase()}
                    </span>
                    <span className="text-white font-medium truncate max-w-[200px]">
                      {mediaAttachment?.name || customMediaName || 'Медиа файл'}
                    </span>
                  </div>
                  {mediaAttachment?.sizeKb && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {mediaAttachment.sizeKb} КБ
                    </span>
                  )}
                </div>

                {/* Media Preview Box */}
                <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-2 flex items-center justify-center min-h-[100px]">
                  {selectedMediaType === 'image' && (
                    <img
                      src={mediaAttachment?.url || customMediaUrl}
                      alt="Превью"
                      className="max-h-40 rounded-lg object-contain"
                    />
                  )}
                  {selectedMediaType === 'gif' && (
                    <img
                      src={mediaAttachment?.url || customMediaUrl}
                      alt="GIF Превью"
                      className="max-h-40 rounded-lg object-contain"
                    />
                  )}
                  {selectedMediaType === 'video' && (
                    <video
                      src={mediaAttachment?.url || customMediaUrl}
                      controls
                      className="max-h-44 rounded-lg w-full"
                    />
                  )}
                  {selectedMediaType === 'audio' && (
                    <div className="w-full p-2 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-sky-400">
                        <Mic className="w-4 h-4 animate-pulse" />
                        <span>Голосовая аудио-заметка (воспроизведение):</span>
                      </div>
                      <audio
                        src={mediaAttachment?.url || customMediaUrl}
                        controls
                        className="w-full h-9"
                      />
                    </div>
                  )}
                </div>

                {/* File Upload & URL Inputs */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] text-slate-400">
                      Загрузить свой файл или вставить прямую ссылку:
                    </label>
                    <label className="cursor-pointer px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Выбрать файл с ПК</span>
                      <input
                        type="file"
                        accept="image/*,video/*,audio/*,.gif"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadFeedback && (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {uploadFeedback}
                    </p>
                  )}

                  <input
                    type="url"
                    value={customMediaUrl}
                    onChange={(e) => {
                      setCustomMediaUrl(e.target.value);
                      if (mediaAttachment) {
                        setMediaAttachment({ ...mediaAttachment, url: e.target.value });
                      }
                    }}
                    placeholder="https://... прямая ссылка на медиафайл"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить шаблон</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
