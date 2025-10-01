const pdfParse = require('pdf-parse');
const fs = require('fs');

async function convert(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    // Clean up the text and convert to markdown
    const text = pdfData.text;
    const markdown = textToMarkdown(text);
    
    // Extract sections for highlighting mapping
    const sections = extractSections(text, markdown);
    
    return {
      markdown: markdown,
      sections: sections,
      pageCount: pdfData.numpages
    };
  } catch (error) {
    throw new Error(`PDF conversion failed: ${error.message}`);
  }
}

function textToMarkdown(text) {
  // Basic text to markdown conversion
  let markdown = text;
  
  // Convert lines that look like headings
  markdown = markdown.replace(/^([A-Z][A-Z\s]+)$/gm, '# $1');
  
  // Convert numbered lists
  markdown = markdown.replace(/^(\d+\.\s+.+)$/gm, '$1');
  
  // Convert bullet points
  markdown = markdown.replace(/^[•·▪▫-]\s+(.+)$/gm, '- $1');
  
  // Clean up multiple newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  return markdown.trim();
}

function extractSections(originalText, markdown) {
  const sections = [];
  const lines = originalText.split('\n');
  let markdownIndex = 0;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 0) {
      const markdownMatch = markdown.indexOf(trimmedLine, markdownIndex);
      if (markdownMatch !== -1) {
        sections.push({
          id: `pdf-section-${index}`,
          originalText: trimmedLine,
          markdownStart: markdownMatch,
          markdownEnd: markdownMatch + trimmedLine.length,
          type: 'paragraph'
        });
        markdownIndex = markdownMatch + trimmedLine.length;
      }
    }
  });
  
  return sections;
}

module.exports = {
  convert
};