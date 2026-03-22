import { useState } from 'react';
import apiClient from '../services/apiClient';

export const useOCR = () => {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractText = async ({ filename, language, preprocess }) => {
    setIsExtracting(true);
    try {
      const { data } = await apiClient.post('/api/ocr/extract', {
        filename,
        language,
        preprocess,
      });
      if (!data?.success) throw new Error(data?.error || 'OCR failed');
      return data.result;
    } finally {
      setIsExtracting(false);
    }
  };

  return { extractText, isExtracting };
};

