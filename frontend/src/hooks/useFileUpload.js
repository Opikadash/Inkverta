import { useState } from 'react';
import apiClient from '../services/apiClient';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (files) => {
    setIsUploading(true);
    try {
      const form = new FormData();
      const isMulti = files.length > 1;

      if (isMulti) {
        for (const file of files) form.append('images', file);
        const { data } = await apiClient.post('/api/upload/multiple', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (!data?.success) throw new Error('Upload failed');
        return data;
      }

      form.append('image', files[0]);
      const { data } = await apiClient.post('/api/upload/single', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!data?.success) throw new Error('Upload failed');
      return data;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFiles, isUploading };
};

