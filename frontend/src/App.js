import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import PreviewPane from './components/PreviewPane';
import './index.css';

function App() {
  const [conversionResult, setConversionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredSection, setHoveredSection] = useState(null);

  const handleConversionSuccess = (result) => {
    setConversionResult(result);
    setError(null);
  };

  const handleConversionError = (errorMessage) => {
    setError(errorMessage);
    setConversionResult(null);
  };

  const handleSectionHover = (sectionId) => {
    setHoveredSection(sectionId);
  };

  const handleSectionLeave = () => {
    setHoveredSection(null);
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1>File to Markdown Converter</h1>
        <p>Upload documents and convert them to Markdown format for easy LLM consumption</p>
      </header>

      <div className="main-content">
        <div className="upload-section">
          <FileUpload
            onSuccess={handleConversionSuccess}
            onError={handleConversionError}
            onLoadingChange={setLoading}
          />
          
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="preview-section">
          <PreviewPane
            title="Original Document"
            content={conversionResult?.filename || 'No file uploaded'}
            type="original"
            loading={loading}
            sections={conversionResult?.sections}
            hoveredSection={hoveredSection}
            onSectionHover={handleSectionHover}
            onSectionLeave={handleSectionLeave}
            imageUrl={conversionResult?.imageUrl}
            enableOCR={true}
          />
          
          <PreviewPane
            title="Markdown Output"
            content={conversionResult?.markdown || 'Upload a file to see the converted markdown'}
            type="markdown"
            loading={loading}
            sections={conversionResult?.sections}
            onSectionHover={handleSectionHover}
            onSectionLeave={handleSectionLeave}
            hoveredSection={hoveredSection}
          />
        </div>
      </div>
    </div>
  );
}

export default App;