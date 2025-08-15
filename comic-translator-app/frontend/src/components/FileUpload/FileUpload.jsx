import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  PhotoIcon,
  DocumentIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const FileUpload = ({ 
  onFileUpload, 
  isUploading, 
  acceptedFiles = ['image/*'],
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024,
  className 
}) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles);
    }
  }, [onFileUpload]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    rejectedFiles
  } = useDropzone({
    onDrop,
    accept: acceptedFiles.reduce((acc, type) => ({
      ...acc,
      [type]: []
    }), {}),
    maxFiles,
    maxSize,
    disabled: isUploading
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={clsx('p-6', className)}>
      <motion.div
        {...getRootProps()}
        className={clsx(
          'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer',
          'flex flex-col items-center justify-center py-12 px-6',
          {
            'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20': 
              isDragActive && !isDragReject,
            'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20': 
              isDragReject,
            'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500': 
              !isDragActive && !isUploading,
            'border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50': 
              isUploading
          }
        )}
        whileHover={!isUploading ? { scale: 1.01 } : {}}
        whileTap={!isUploading ? { scale: 0.99 } : {}}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          {isUploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          ) : (
            <CloudArrowUpIcon 
              className={clsx(
                'h-12 w-12 mb-4',
                {
                  'text-blue-500': isDragActive && !isDragReject,
                  'text-red-500': isDragReject,
                  'text-gray-400 dark:text-gray-500': !isDragActive
                }
              )} 
            />
          )}
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isUploading 
              ? 'Uploading files...' 
              : isDragActive 
                ? 'Drop files here' 
                : 'Upload comic images'
            }
          </h3>
          
          <p className="text-gray-500 dark:text-gray-400 text-center">
            {isDragReject ? (
              'Some files are not supported'
            ) : (
              <>
                Drag and drop up to {maxFiles} images, or{' '}
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  click to browse
                </span>
              </>
            )}
          </p>
          
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <PhotoIcon className="h-5 w-5 mr-2" />
              JPG, PNG, WebP
            </div>
            <div>
              Max {formatFileSize(maxSize)}
            </div>
          </div>
        </div>
      </motion.div>

      {rejectedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
            Rejected files:
          </h4>
          <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
            {rejectedFiles.map(({ file, errors }) => (
              <li key={file.name} className="flex items-center">
                <DocumentIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="font-medium mr-2">{file.name}</span>
                <span>- {errors[0]?.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
