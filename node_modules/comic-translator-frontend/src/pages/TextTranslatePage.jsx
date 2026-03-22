import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from '@/hooks/useTranslation';

const TextTranslatePage = () => {
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [settings, setSettings] = useState({
    sourceLang: 'auto',
    targetLang: 'en',
    service: 'google',
  });

  const { translateText, isTranslating } = useTranslation();

  const canTranslate = useMemo(() => text.trim().length > 0, [text]);

  const onTranslate = async () => {
    try {
      const result = await translateText({
        text,
        sourceLang: settings.sourceLang,
        targetLang: settings.targetLang,
        service: settings.service,
      });
      setTranslatedText(result.translatedText);
      toast.success('Translation completed');
    } catch (error) {
      toast.error('Translation failed');
    }
  };

  const copy = async (value) => {
    await navigator.clipboard.writeText(value);
    toast.success('Copied');
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Novel / Text Translator</h1>
        <p className="mt-2 text-gray-600">
          Paste text from novels, subtitles, or OCR output and translate instantly.
        </p>

        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={settings.sourceLang}
              onChange={(e) => setSettings({ ...settings, sourceLang: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            >
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="hi">Hindi</option>
            </select>

            <span className="text-gray-400">→</span>

            <select
              value={settings.targetLang}
              onChange={(e) => setSettings({ ...settings, targetLang: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="hi">Hindi</option>
              <option value="ja">Japanese</option>
            </select>

            <select
              value={settings.service}
              onChange={(e) => setSettings({ ...settings, service: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            >
              <option value="google">Google Translate</option>
              <option value="deepl">DeepL</option>
            </select>

            <button
              onClick={onTranslate}
              disabled={!canTranslate || isTranslating}
              className="ml-auto px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
            >
              {isTranslating ? 'Translating…' : 'Translate'}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-900">Original</div>
                <button
                  type="button"
                  className="text-sm text-gray-600"
                  onClick={() => copy(text)}
                  disabled={!text}
                >
                  Copy
                </button>
              </div>
              <textarea
                className="w-full min-h-[260px] p-3 border border-gray-300 rounded-md"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text here…"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-900">Translation</div>
                <button
                  type="button"
                  className="text-sm text-gray-600"
                  onClick={() => copy(translatedText)}
                  disabled={!translatedText}
                >
                  Copy
                </button>
              </div>
              <textarea
                className="w-full min-h-[260px] p-3 border border-gray-300 rounded-md bg-gray-50"
                value={translatedText}
                readOnly
                placeholder="Translated text appears here…"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextTranslatePage;
