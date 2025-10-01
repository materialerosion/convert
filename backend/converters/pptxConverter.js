const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function convert(filePath) {
  try {
    // For now, we'll use a simple approach that extracts text
    // In a production environment, you might want to use python-pptx via a Python script
    // or use a more sophisticated library
    
    const fileName = path.basename(filePath, path.extname(filePath));
    const tempTextFile = path.join(path.dirname(filePath), `${fileName}-temp.txt`);
    
    try {
      // Try to use libreoffice to convert to text if available
      execSync(`libreoffice --headless --convert-to txt --outdir "${path.dirname(filePath)}" "${filePath}"`, 
        { stdio: 'ignore', timeout: 30000 });
      
      const textContent = fs.readFileSync(tempTextFile, 'utf8');
      const markdown = textToMarkdown(textContent);
      const sections = extractSections(textContent, markdown);
      
      // Clean up temp file
      if (fs.existsSync(tempTextFile)) {
        fs.unlinkSync(tempTextFile);
      }
      
      return {
        markdown: markdown,
        sections: sections
      };
    } catch (libreofficeError) {
      // Fallback: create a basic markdown indicating the file type
      const fallbackMarkdown = `# PowerPoint Presentation\n\n*File: ${path.basename(filePath)}*\n\n**Note:** PowerPoint conversion requires LibreOffice or similar tools to be installed. The presentation content could not be extracted.`;
      
      return {
        markdown: fallbackMarkdown,
        sections: [{
          id: 'pptx-fallback',
          originalText: path.basename(filePath),
          markdownStart: 0,
          markdownEnd: fallbackMarkdown.length,
          type: 'fallback'
        }]
      };
    }
  } catch (error) {
    throw new Error(`PowerPoint conversion failed: ${error.message}`);
  }
}

function textToMarkdown(text) {
  let markdown = text;
  
  // Convert lines that look like slide titles (usually in caps or standalone)
  markdown = markdown.replace(/^([A-Z][A-Z\s]+)$/gm, '## $1');
  
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
          id: `pptx-section-${index}`,
          originalText: trimmedLine,
          markdownStart: markdownMatch,
          markdownEnd: markdownMatch + trimmedLine.length,
          type: 'slide-content'
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