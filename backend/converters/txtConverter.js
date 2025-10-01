const fs = require('fs');

async function convert(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const markdown = textToMarkdown(text);
    const sections = extractSections(text, markdown);
    
    return {
      markdown: markdown,
      sections: sections
    };
  } catch (error) {
    throw new Error(`Text file conversion failed: ${error.message}`);
  }
}

function textToMarkdown(text) {
  let markdown = text;
  
  // Convert lines that look like headings (lines followed by equals or dashes)
  markdown = markdown.replace(/^(.+)\n=+$/gm, '# $1');
  markdown = markdown.replace(/^(.+)\n-+$/gm, '## $1');
  
  // Convert lines that are in ALL CAPS and standalone as headings
  markdown = markdown.replace(/^([A-Z][A-Z\s]{2,})$/gm, '### $1');
  
  // Convert numbered lists (if they exist)
  markdown = markdown.replace(/^(\d+\.\s+.+)$/gm, '$1');
  
  // Convert bullet points (if they exist)
  markdown = markdown.replace(/^[•·▪▫*-]\s+(.+)$/gm, '- $1');
  
  // Preserve code blocks if they exist (indented by 4 spaces or tabs)
  markdown = markdown.replace(/^(    .+)$/gm, '$1');
  
  // Clean up multiple newlines but preserve paragraph breaks
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
      // Try to find this line in the markdown
      let searchText = trimmedLine;
      
      // If the line was converted to a heading, search for the heading version
      if (/^[A-Z][A-Z\s]{2,}$/.test(trimmedLine)) {
        searchText = `### ${trimmedLine}`;
      }
      
      const markdownMatch = markdown.indexOf(searchText, markdownIndex);
      if (markdownMatch !== -1) {
        sections.push({
          id: `txt-section-${index}`,
          originalText: trimmedLine,
          markdownStart: markdownMatch,
          markdownEnd: markdownMatch + searchText.length,
          type: determineLineType(trimmedLine)
        });
        markdownIndex = markdownMatch + searchText.length;
      }
    }
  });
  
  return sections;
}

function determineLineType(line) {
  if (/^[A-Z][A-Z\s]{2,}$/.test(line)) {
    return 'heading';
  } else if (/^\d+\.\s+/.test(line)) {
    return 'numbered-list';
  } else if (/^[•·▪▫*-]\s+/.test(line)) {
    return 'bullet-list';
  } else if (/^    /.test(line)) {
    return 'code';
  } else {
    return 'paragraph';
  }
}

module.exports = {
  convert
};