import { useState } from 'react';
import apiClient from '../services/apiClient';

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = async ({ text, sourceLang, targetLang, service }) => {
    setIsTranslating(true);
    try {
      const { data } = await apiClient.post('/api/translate', {
        text,
        sourceLang,
        targetLang,
        service,
      });
      if (!data?.success) throw new Error(data?.error || 'Translation failed');
      return data.result;
    } finally {
      setIsTranslating(false);
    }
  };

  return { translateText, isTranslating };
};

