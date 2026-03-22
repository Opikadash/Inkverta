import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import apiClient from '../services/apiClient';
import { useTranslation } from '../hooks/useTranslation';

const DEFAULT_TARGET_LANG = 'en';

const LinkTranslatePage = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);
  const [service, setService] = useState('google');
  const [translatedBlocks, setTranslatedBlocks] = useState(null);

  const { translateText, isTranslating } = useTranslation();

  const canTranslateBlocks = useMemo(() => {
    return Array.isArray(result?.textBlocks) && result.textBlocks.length > 0;
  }, [result]);

  const onIngest = async (e) => {
    e.preventDefault();
    setTranslatedBlocks(null);
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/api/url/ingest', { url });
      if (!data?.success) throw new Error(data?.error || 'URL ingest failed');
      setResult(data);
      toast.success('Imported page content');
    } catch (err) {
      toast.error(err?.message || 'Failed to import URL');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onTranslateBlocks = async () => {
    if (!canTranslateBlocks) return;
    try {
      const { data } = await apiClient.post('/api/translate/batch', {
        texts: result.textBlocks,
        sourceLang: 'auto',
        targetLang,
        service,
      });

      if (!data?.success) throw new Error(data?.error || 'Batch translation failed');
      setTranslatedBlocks(data.results || []);
      toast.success('Translated text blocks');
    } catch (err) {
      toast.error(err?.message || 'Failed to translate');
    }
  };

  const onTranslateSingle = async (text) => {
    try {
      const r = await translateText({ text, sourceLang: 'auto', targetLang, service });
      await navigator.clipboard.writeText(r.translatedText);
      toast.success('Translated text copied');
    } catch (err) {
      toast.error(err?.message || 'Failed to translate');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Link Import</h1>
        <p className="text-sm text-gray-600 mt-1">
          Paste a webcomic/manga/novel URL. Inkverta imports the page, extracts image URLs and text
          blocks, then you can translate them here.
        </p>
      </div>

      <form onSubmit={onIngest} className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Page URL</label>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isLoading ? 'Importing…' : 'Import'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Target</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese (Simplified)</option>
              <option value="zh-TW">Chinese (Traditional)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Service</span>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="google">Google</option>
              <option value="deepl">DeepL</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onTranslateBlocks}
            disabled={!canTranslateBlocks || isLoading || isTranslating}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 disabled:opacity-60"
          >
            {isTranslating ? 'Translating…' : 'Translate Text Blocks'}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Images</h2>
            <p className="text-xs text-gray-600 mt-1">
              Found {result.images?.length || 0} images. Open an image in a new tab to use the
              Chrome extension overlay, or download and upload it to the Image OCR page.
            </p>

            <div className="mt-3 space-y-3">
              {(result.images || []).slice(0, 24).map((img) => (
                <div key={img} className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <img src={img} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs text-gray-700">{img}</div>
                    <div className="mt-1 flex gap-2">
                      <a
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(img);
                          toast.success('Image URL copied');
                        }}
                        className="text-xs text-gray-700 hover:underline"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(result.images || []).length > 24 && (
              <div className="mt-3 text-xs text-gray-600">
                Showing first 24 images. (Some sites lazy-load images; the extension is best for
                on-site translation.)
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Text Blocks</h2>
            <p className="text-xs text-gray-600 mt-1">
              Found {result.textBlocks?.length || 0} blocks. You can translate all blocks or click a
              single block to translate and copy it.
            </p>

            <div className="mt-3 space-y-3 max-h-[560px] overflow-auto pr-2">
              {(translatedBlocks || result.textBlocks || []).slice(0, 80).map((b, idx) => {
                const original = translatedBlocks ? b.originalText : b;
                const translated = translatedBlocks ? b.translatedText : null;
                return (
                  <button
                    key={`${idx}-${original?.slice(0, 20)}`}
                    type="button"
                    onClick={() => onTranslateSingle(original)}
                    className="w-full text-left rounded-md border border-gray-200 p-3 hover:border-gray-300"
                  >
                    <div className="text-sm text-gray-900">{original}</div>
                    {translated && (
                      <div className="mt-2 text-sm text-blue-700">{translated}</div>
                    )}
                    {translatedBlocks && b.success === false && (
                      <div className="mt-2 text-xs text-red-600">{b.error || 'Failed'}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkTranslatePage;

