const mammoth = require('mammoth');
const TurndownService = require('turndown');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

async function convert(filePath) {
  try {
    const result = await mammoth.convertToHtml(filePath);
    const html = result.value;
    
    // Convert HTML to Markdown
    const markdown = turndownService.turndown(html);
    
    // Extract sections for highlighting mapping
    const sections = extractSections(html, markdown);
    
    return {
      markdown: markdown,
      sections: sections,
      warnings: result.messages
    };
  } catch (error) {
    throw new Error(`DOCX conversion failed: ${error.message}`);
  }
}

function extractSections(html, markdown) {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const sections = [];
  
  let markdownIndex = 0;
  
  // Extract paragraphs and headings with their positions
  $('p, h1, h2, h3, h4, h5, h6').each((index, element) => {
    const text = $(element).text().trim();
    if (text) {
      const markdownMatch = markdown.indexOf(text, markdownIndex);
      if (markdownMatch !== -1) {
        sections.push({
          id: `section-${index}`,
          originalText: text,
          markdownStart: markdownMatch,
          markdownEnd: markdownMatch + text.length,
          type: element.tagName.toLowerCase()
        });
        markdownIndex = markdownMatch + text.length;
      }
    }
  });
  
  return sections;
}

module.exports = {
  convert
};