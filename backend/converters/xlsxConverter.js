const XLSX = require('xlsx');

async function convert(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    let markdown = '';
    const sections = [];
    
    // Process each worksheet
    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Add sheet header
      markdown += `# ${sheetName}\n\n`;
      
      // Convert to JSON to get structured data
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        // Create markdown table
        const tableMarkdown = createMarkdownTable(jsonData);
        markdown += tableMarkdown + '\n\n';
        
        // Add sections for highlighting
        sections.push({
          id: `sheet-${sheetIndex}`,
          originalText: sheetName,
          markdownStart: markdown.indexOf(`# ${sheetName}`),
          markdownEnd: markdown.indexOf(`# ${sheetName}`) + `# ${sheetName}`.length,
          type: 'sheet-header'
        });
      }
    });
    
    return {
      markdown: markdown.trim(),
      sections: sections,
      sheetCount: workbook.SheetNames.length
    };
  } catch (error) {
    throw new Error(`Excel conversion failed: ${error.message}`);
  }
}

function createMarkdownTable(data) {
  if (data.length === 0) return '';
  
  const headers = data[0] || [];
  const rows = data.slice(1);
  
  // Create header row
  let table = '| ' + headers.map(h => h || '').join(' | ') + ' |\n';
  
  // Create separator row
  table += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  // Create data rows
  rows.forEach(row => {
    const cells = headers.map((_, index) => {
      const cell = row[index];
      return cell !== undefined ? String(cell) : '';
    });
    table += '| ' + cells.join(' | ') + ' |\n';
  });
  
  return table;
}

module.exports = {
  convert
};