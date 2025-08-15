import React, { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Image, Rect, Text } from 'react-konva';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  CogIcon,
  PlayIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const ImageEditor = ({ 
  files, 
  selectedFile, 
  onFileSelect, 
  onOCRExtract, 
  isProcessing,
  settings,
  onSettingsChange 
}) => {
  const [imageObj, setImageObj] = useState(null);
  const [scale, setScale] = useState(1);
  const [selection, setSelection] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const imageRef = useRef();

  const handleImageLoad = useCallback((image) => {
    setImageObj(image);
    const stage = imageRef.current?.getStage();
    if (stage && image) {
      const scaleX = stage.width() / image.width;
      const scaleY = stage.height() / image.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(newScale);
    }
  }, []);

  const handleImageClick = useCallback((e) => {
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    // Add text selection logic here
  }, []);

  return (
    <div className="flex h-[600px]">
      {/* File List Sidebar */}
      <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Uploaded Files
          </h3>
        </div>
        <div className="p-2 space-y-2 overflow-y-auto max-h-[500px]">
          {files.map((file, index) => (
            <motion.div
              key={file.id || index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFileSelect(file)}
              className={`
                p-3 rounded-lg cursor-pointer transition-colors
                ${selectedFile?.id === file.id 
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600' 
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                }
                border
              `}
            >
              <div className="flex items-center space-x-3">
                <PhotoIcon className="h-8 w-8 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <CogIcon className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
          
          <button
            onClick={onOCRExtract}
            disabled={!selectedFile || isProcessing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayIcon className="h-4 w-4" />
            <span>{isProcessing ? 'Processing...' : 'Extract Text'}</span>
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OCR Language
                </label>
                <select
                  value={settings.ocrLang}
                  onChange={(e) => onSettingsChange({ ...settings, ocrLang: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="eng">English</option>
                  <option value="jpn">Japanese</option>
                  <option value="kor">Korean</option>
                  <option value="chi_sim">Chinese (Simplified)</option>
                  <option value="chi_tra">Chinese (Traditional)</option>
                  <option value="eng+jpn">English + Japanese</option>
                  <option value="eng+jpn+kor">English + Japanese + Korean</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preprocess Image
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.preprocess !== false}
                    onChange={(e) => onSettingsChange({ ...settings, preprocess: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Enhance image for better OCR
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          {selectedFile ? (
            <div className="w-full h-full relative">
              <Stage
                width={window.innerWidth - 300}
                height={500}
                ref={imageRef}
                onClick={handleImageClick}
              >
                <Layer>
                  <Image
                    image={imageObj}
                    scaleX={scale}
                    scaleY={scale}
                    onLoad={handleImageLoad}
                  />
                  {selection && (
                    <Rect
                      x={selection.x}
                      y={selection.y}
                      width={selection.width}
                      height={selection.height}
                      stroke="blue"
                      strokeWidth={2}
                      fill="rgba(0,0,255,0.1)"
                    />
                  )}
                </Layer>
              </Stage>
              
              {selectedFile && (
                <img
                  src={`/api/uploads/${selectedFile.filename}`}
                  alt="Preview"
                  className="hidden"
                  onLoad={(e) => handleImageLoad(e.target)}
                />
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <PhotoIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Select an image to start editing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
