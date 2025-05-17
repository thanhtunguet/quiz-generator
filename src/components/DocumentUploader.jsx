import React, { useState } from 'react';
import { uploadFile } from '../services/api';

const SUPPORTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/markdown': '.md'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DocumentUploader = ({ onTextExtracted, setIsLoading, setErrorMessage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file) => {
    if (!file) {
      throw new Error('No file selected');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Check file type
    const extension = file.name.split('.').pop().toLowerCase();
    const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES);

    if (!supportedExtensions.includes(`.${extension}`)) {
      throw new Error(
        `Unsupported file type. Supported types are: ${supportedExtensions.join(', ')}`
      );
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (files) => {
    try {
      if (files.length > 0) {
        const file = files[0];
        validateFile(file);
        setSelectedFile(file);
        setErrorMessage(null);
      }
    } catch (error) {
      setErrorMessage(error.message);
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file first.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await uploadFile(formData);

      if (response.success) {
        onTextExtracted(response.content);
      } else {
        throw new Error(response.error || 'Error uploading file');
      }
    } catch (error) {
      setErrorMessage(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Upload Document</h2>

      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center 
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="text-lg text-gray-600">
            Drag & drop your file here, or <span className="text-blue-500">browse</span>
          </p>
          <p className="text-sm text-gray-500">
            Supported formats: PDF, DOC, DOCX, TXT, MD (max 10MB)
          </p>
          <input
            type="file"
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <label
            htmlFor="file-upload"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer"
          >
            Select File
          </label>
        </div>
      </div>

      {selectedFile && (
        <div className="mb-4 p-4 bg-gray-100 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setErrorMessage(null);
              }}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          className={`px-6 py-2 rounded-md ${!selectedFile
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          Upload Document
        </button>
      </div>
    </div>
  );
};

export default DocumentUploader;