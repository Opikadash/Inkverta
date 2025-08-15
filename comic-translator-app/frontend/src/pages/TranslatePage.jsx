mport React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import FileUpload from '@components/FileUpload/FileUpload';
import ImageEditor from '@components/ImageEditor/ImageEditor';
import TranslationPanel from '@components/Translation/TranslationPanel';
import ProgressBar from '@components/UI/ProgressBar';
import LoadingSpinner from '@components/UI/LoadingSpinner';

import { useTranslation } from '@/hooks/useTranslation';
import { useOCR } from '@/hooks/useOCR';
import { useFileUpload } from '@/hooks/useFileUpload';

const TranslatePage = () => {
  const [currentStep, setCurrentStep] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [settings, setSettings] = useState({
    sourceLang: 'auto',
    targetLang: 'en',
    service: 'google',
    ocrLang: 'eng+jpn'
  });

  const { uploadFiles, isUploading } = useFileUpload();
  const { extractText, isExtracting } = useOCR();
  const { translateText, isTranslating } = useTranslation();

  const handleFileUpload = useCallback(async (files) => {
    try {
      const result = await uploadFiles(files);
      setUploadedFiles(result.files || [result.file]);
      setCurrentStep('edit');
      toast.success(`Uploaded ${files.length} file(s) successfully`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Upload error:', error);
    }
  }, [uploadFiles]);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
  }, []);

  const handleOCRExtract = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setCurrentStep('processing');
      const result = await extractText({
        filename: selectedFile.filename,
        language: settings.ocrLang,
        preprocess: true
      });
      
      setExtractedText(result.text);
      setCurrentStep('translate');
      toast.success('Text extracted successfully');
    } catch (error) {
      toast.error('Failed to extract text');
      setCurrentStep('edit');
      console.error('OCR error:', error);
    }
  }, [selectedFile, settings.ocrLang, extractText]);

  const handleTranslate = useCallback(async () => {
    if (!extractedText.trim()) return;

    try {
      const result = await translateText({
        text: extractedText,
        sourceLang: settings.sourceLang,
        targetLang: settings.targetLang,
        service: settings.service
      });
      
      setTranslatedText(result.translatedText);
      toast.success('Translation completed');
    } catch (error) {
      toast.error('Translation failed');
      console.error('Translation error:', error);
    }
  }, [extractedText, settings, translateText]);

  const steps = [
    { id: 'upload', name: 'Upload', completed: uploadedFiles.length > 0 },
    { id: 'edit', name: 'Edit', completed: selectedFile !== null },
    { id: 'processing', name: 'Process', completed: extractedText !== '' },
    { id: 'translate', name: 'Translate', completed: translatedText !== '' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUpload
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            acceptedFiles={['image/jpeg', 'image/png', 'image/webp']}
            maxFiles={10}
            maxSize={50 * 1024 * 1024}
          />
        );

      case 'edit':
        return (
          <ImageEditor
            files={uploadedFiles}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onOCRExtract={handleOCRExtract}
            isProcessing={isExtracting}
            settings={settings}
            onSettingsChange={setSettings}
          />
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Extracting text from image...
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              This may take a few moments
            </p>
          </div>
        );

      case 'translate':
        return (
          <TranslationPanel
            extractedText={extractedText}
            translatedText={translatedText}
            settings={settings}
            onSettingsChange={setSettings}
            onTranslate={handleTranslate}
            isTranslating={isTranslating}
            selectedFile={selectedFile}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Comic Translator
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload comic images, extract text, and translate instantly
          </p>
        </div>

        <ProgressBar 
          steps={steps} 
          currentStep={currentStep} 
          className="mb-8"
        />

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          {renderStepContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default TranslatePage;
