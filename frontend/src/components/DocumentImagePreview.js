import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const DocumentImagePreview = ({ 
  imageUrl, 
  sections = [], 
  hoveredSection, 
  onSectionHover, 
  onSectionLeave,
  enableOCR = true 
}) => {
  const [image, setImage] = useState(null);
  const [ocrResults, setOcrResults] = useState([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });
  const [highlights, setHighlights] = useState([]);
  const [imageError, setImageError] = useState(null);
  const canvasRef = useRef();
  const containerRef = useRef();

  // Load image
  useEffect(() => {
    if (imageUrl) {
      console.log('Loading image from URL:', imageUrl);
      console.log('Full URL will be:', `http://localhost:3001${imageUrl}`);
      setImageError(null);
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        // Adjust canvas size to fit image
        const aspectRatio = img.height / img.width;
        const maxWidth = 600;
        const maxHeight = 800;
        
        let width = Math.min(img.width, maxWidth);
        let height = width * aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height / aspectRatio;
        }
        
        setCanvasSize({ width, height });
      };
      img.onerror = (error) => {
        console.error("Failed to load image from URL:", imageUrl);
        console.error("Full URL attempted:", `http://localhost:3001${imageUrl}`);
        console.error("Image load error details:", error);
        setImageError(`Failed to load image from http://localhost:3001${imageUrl}`);
        setImage(null);
      };
      img.src = `http://localhost:3001${imageUrl}`;
    }
  }, [imageUrl]);

  // Draw image and highlights on canvas
  useEffect(() => {
    if (image && canvasRef.current) {
      drawCanvas();
    }
  }, [image, highlights, hoveredSection]);

  // Process OCR when enabled
  useEffect(() => {
    if (ocrEnabled && image && !isProcessingOCR && ocrResults.length === 0) {
      performOCR();
    }
  }, [ocrEnabled, image, isProcessingOCR, ocrResults.length]);

  // Update highlights based on sections and OCR results
  useEffect(() => {
    if (sections.length > 0 && ocrResults.length > 0) {
      const newHighlights = createHighlightsFromSections();
      setHighlights(newHighlights);
    }
  }, [sections, ocrResults]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image
    ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);
    
    // Draw highlights
    highlights.forEach(highlight => {
      const isHovered = hoveredSection === highlight.sectionId;
      
      // Set highlight style
      ctx.fillStyle = isHovered ? 'rgba(255, 255, 0, 0.6)' : 'rgba(0, 123, 255, 0.3)';
      ctx.strokeStyle = isHovered ? '#ffc107' : '#007bff';
      ctx.lineWidth = isHovered ? 2 : 1;
      
      // Draw highlight rectangle
      ctx.fillRect(highlight.x, highlight.y, highlight.width, highlight.height);
      ctx.strokeRect(highlight.x, highlight.y, highlight.width, highlight.height);
      
      // Draw text label if hovered
      if (isHovered) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(highlight.x, highlight.y - 20, highlight.text.length * 8, 16);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(highlight.text, highlight.x + 2, highlight.y - 6);
      }
    });
  };

  const performOCR = async () => {
    if (!image) return;
    
    setIsProcessingOCR(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      
      const result = await Tesseract.recognize(canvas, 'eng', {
        logger: m => console.log(m)
      });
      
      setOcrResults(result.data.words || []);
    } catch (error) {
      console.error('OCR failed:', error);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const createHighlightsFromSections = () => {
    const highlights = [];
    
    sections.forEach((section) => {
      // Find OCR words that match this section's text
      const sectionWords = section.originalText.toLowerCase().split(/\s+/);
      const matchingOCRWords = [];
      
      sectionWords.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 2) { // Only match words longer than 2 characters
          const ocrWord = ocrResults.find(ocrWord => 
            ocrWord.text.toLowerCase().replace(/[^\w]/g, '').includes(cleanWord) ||
            cleanWord.includes(ocrWord.text.toLowerCase().replace(/[^\w]/g, ''))
          );
          if (ocrWord && !matchingOCRWords.includes(ocrWord)) {
            matchingOCRWords.push(ocrWord);
          }
        }
      });
      
      // Create highlights for matched words
      matchingOCRWords.forEach((ocrWord, index) => {
        const scaleX = canvasSize.width / image.width;
        const scaleY = canvasSize.height / image.height;
        
        highlights.push({
          id: `${section.id}-${index}`,
          sectionId: section.id,
          x: ocrWord.bbox.x0 * scaleX,
          y: ocrWord.bbox.y0 * scaleY,
          width: (ocrWord.bbox.x1 - ocrWord.bbox.x0) * scaleX,
          height: (ocrWord.bbox.y1 - ocrWord.bbox.y0) * scaleY,
          text: ocrWord.text,
          originalText: section.originalText
        });
      });
    });
    
    return highlights;
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked highlight
    const clickedHighlight = highlights.find(highlight => 
      x >= highlight.x && x <= highlight.x + highlight.width &&
      y >= highlight.y && y <= highlight.y + highlight.height
    );

    if (clickedHighlight && onSectionHover) {
      onSectionHover(clickedHighlight.sectionId);
    }
  };

  const handleCanvasMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find hovered highlight
    const hoveredHighlight = highlights.find(highlight => 
      x >= highlight.x && x <= highlight.x + highlight.width &&
      y >= highlight.y && y <= highlight.y + highlight.height
    );

    if (hoveredHighlight && onSectionHover) {
      onSectionHover(hoveredHighlight.sectionId);
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
      if (onSectionLeave) {
        onSectionLeave();
      }
    }
  };

  if (!imageUrl) {
    return (
      <div className="document-image-preview">
        <div className="image-controls">
          {enableOCR && sections.length > 0 && (
            <label className="ocr-toggle">
              <input
                type="checkbox"
                checked={false}
                disabled={true}
              />
              OCR requires image preview
            </label>
          )}
          <div className="ocr-stats">
            {sections.length > 0 && (
              <span>{sections.length} sections detected</span>
            )}
          </div>
        </div>
        <div className="image-preview-placeholder">
          <p>📷 Image preview not available</p>
          <p>This file type doesn't support image conversion yet</p>
          {sections.length > 0 && (
            <p>But {sections.length} text sections were detected for highlighting</p>
          )}
        </div>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="document-image-preview">
        <div className="image-preview-placeholder error">
          <p>⚠️ Image Loading Error</p>
          <p>{imageError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-image-preview">
      <div className="image-controls">
        {enableOCR && (
          <label className="ocr-toggle">
            <input
              type="checkbox"
              checked={ocrEnabled}
              onChange={(e) => setOcrEnabled(e.target.checked)}
              disabled={isProcessingOCR}
            />
            Enable OCR Highlighting
            {isProcessingOCR && <span className="processing"> (Processing...)</span>}
          </label>
        )}
        <div className="ocr-stats">
          {ocrResults.length > 0 && (
            <span>{ocrResults.length} words detected</span>
          )}
          {highlights.length > 0 && (
            <span>{highlights.length} highlights mapped</span>
          )}
        </div>
      </div>
      
      <div className="image-canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          style={{
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            cursor: 'default'
          }}
        />
      </div>
    </div>
  );
};

export default DocumentImagePreview;