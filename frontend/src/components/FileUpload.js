import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './FileUpload.css';

const FileUpload = ({ onSuccess, onError, onLoadingChange }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['.doc', '.docx', '.pdf', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      onError('Unsupported file type. Please upload a .doc, .docx, .pdf, .xls, .xlsx, .ppt, .pptx, or .txt file.');
      return;
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      onError('File too large. Please upload a file smaller than 50MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      onLoadingChange(true);
      onError(null);
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
      });

      if (response.data.success) {
        onSuccess(response.data);
      } else {
        throw new Error(response.data.error || 'Conversion failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.code === 'ECONNABORTED') {
        onError('Upload timeout. Please try with a smaller file.');
      } else if (error.response?.data?.error) {
        onError(error.response.data.error);
      } else {
        onError('Upload failed. Please try again.');
      }
    } finally {
      onLoadingChange(false);
    }
  }, [onSuccess, onError, onLoadingChange]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  return (
    <div className="file-upload-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'drag-active' : ''} ${isDragReject ? 'drag-reject' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="dropzone-content">
          <div className="upload-icon">📄</div>
          
          {isDragActive ? (
            <p>Drop the file here...</p>
          ) : (
            <>
              <p><strong>Click to upload</strong> or drag and drop</p>
              <p className="file-types">
                Supported formats: DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX, TXT
              </p>
              <p className="file-size">Maximum file size: 50MB</p>
            </>
          )}
        </div>
      </div>
      
      <div className="upload-info">
        <h3>How it works:</h3>
        <ol>
          <li>Upload your document using the area above</li>
          <li>The file will be converted to Markdown format</li>
          <li>View the original and converted content side-by-side</li>
          <li>Hover over sections to see highlighting</li>
          <li>Copy the Markdown for use with LLMs</li>
        </ol>
      </div>
    </div>
  );
};

export default FileUpload;