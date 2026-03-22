import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import { 
  ArrowRightIcon, 
  ClipboardIcon,
  DownloadIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TranslationPanel = ({ 
  extractedText, 
  translatedText, 
  settings, 
  onSettingsChange, 
  onTranslate, 
  isTranslating,
  selectedFile 
}) => {
  const [editedText, setEditedText] = useState(extractedText);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    });
  };

  const handleDownload = () => {
    const content = `Original Text:\n${extractedText}\n\nTranslated Text:\n${translatedText}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-${selectedFile?.originalName || 'result'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Translation
        </h2>
        
        {/* Language Selection */}
        <div className="flex items-center space-x-4 mb-6">
          <select
            value={settings.sourceLang}
            onChange={(e) => onSettingsChange({ ...settings, sourceLang: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="auto">Auto-detect</option>
            <option value="en">English</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
          
          <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          
          <select
            value={settings.targetLang}
            onChange={(e) => onSettingsChange({ ...settings, targetLang: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="en">English</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
          
          <select
            value={settings.service}
            onChange={(e) => onSettingsChange({ ...settings, service: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="google">Google Translate</option>
            <option value="deepl">DeepL</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Text */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Extracted Text
            </h3>
            <button
              onClick={() => handleCopyToClipboard(editedText)}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ClipboardIcon className="h-4 w-4" />
              <span>Copy</span>
            </button>
          </div>
          
          <TextareaAutosize
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Extracted text will appear here..."
            className="w-full min-h-[200px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            minRows={8}
          />
          
          <button
            onClick={() => onTranslate(editedText)}
            disabled={!editedText.trim() || isTranslating}
            className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTranslating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <ArrowRightIcon className="h-4 w-4" />
            )}
            <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
          </button>
        </div>

        {/* Translated Text */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Translation
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleCopyToClipboard(translatedText)}
                disabled={!translatedText}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <ClipboardIcon className="h-4 w-4" />
                <span>Copy</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!translatedText}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <DownloadIcon className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
          
          <TextareaAutosize
            value={translatedText}
            readOnly
            placeholder="Translation will appear here..."
            className="w-full min-h-[200px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            minRows={8}
          />
        </div>
      </div>
    </div>
  );
};

export default TranslationPanel;
