import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DocumentImagePreview from './DocumentImagePreview';
import './PreviewPane.css';
import './DocumentImagePreview.css';

const PreviewPane = ({
  title,
  content,
  type,
  loading,
  sections = [],
  onSectionHover,
  onSectionLeave,
  hoveredSection,
  imageUrl,
  enableOCR = true
}) => {
  const handleMouseOver = (event) => {
    if (type === 'markdown' && onSectionHover) {
      // Find which section this text belongs to
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textContent = range.toString() || event.target.textContent;
        
        // Find matching section
        const matchingSection = sections.find(section => 
          textContent.includes(section.originalText) || 
          section.originalText.includes(textContent)
        );
        
        if (matchingSection) {
          onSectionHover(matchingSection.id);
        }
      }
    }
  };

  const handleMouseLeave = () => {
    if (type === 'markdown' && onSectionLeave) {
      onSectionLeave();
    }
  };

  const copyToClipboard = async () => {
    if (type === 'markdown' && content && content !== 'Upload a file to see the converted markdown') {
      try {
        await navigator.clipboard.writeText(content);
        // You could add a toast notification here
        alert('Markdown copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Failed to copy to clipboard');
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      );
    }

    if (type === 'original') {
      return (
        <div className="original-content">
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <h3>{content}</h3>
              <p>Original document with OCR highlighting and section mapping.</p>
              {sections.length > 0 && (
                <p className="section-count">
                  {sections.length} sections identified for highlighting
                </p>
              )}
            </div>
          </div>
          
          {imageUrl ? (
            <DocumentImagePreview
              imageUrl={imageUrl ? `http://localhost:3001${imageUrl}` : null}
              sections={sections}
              hoveredSection={hoveredSection}
              onSectionHover={onSectionHover}
              onSectionLeave={onSectionLeave}
              enableOCR={enableOCR}
            />
          ) : (
            <div className="no-image-preview">
              <p>📷 Image preview not available for this file type</p>
              {sections.length > 0 && (
                <div className="section-list">
                  <h4>Detected Sections:</h4>
                  <ul>
                    {sections.slice(0, 10).map((section, index) => (
                      <li 
                        key={section.id}
                        className={`section-item ${hoveredSection === section.id ? 'highlighted' : ''}`}
                      >
                        <span className="section-type">{section.type}</span>
                        <span className="section-text">
                          {section.originalText.substring(0, 80)}
                          {section.originalText.length > 80 ? '...' : ''}
                        </span>
                      </li>
                    ))}
                    {sections.length > 10 && (
                      <li className="section-item more-sections">
                        ...and {sections.length - 10} more sections
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (type === 'markdown') {
      return (
        <div 
          className="markdown-content"
          onMouseOver={handleMouseOver}
          onMouseLeave={handleMouseLeave}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    return <div className="preview-placeholder">{content}</div>;
  };

  return (
    <div className="preview-pane">
      <div className="preview-header">
        <span>{title}</span>
        {type === 'markdown' && content && content !== 'Upload a file to see the converted markdown' && (
          <button 
            className="copy-button"
            onClick={copyToClipboard}
            title="Copy markdown to clipboard"
          >
            📋 Copy
          </button>
        )}
      </div>
      <div className="preview-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default PreviewPane;