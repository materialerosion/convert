# File to Markdown Converter

A full-stack web application that converts various document formats (.doc/.docx, .xls/.xlsx, .pdf, .ppt/.pptx, .txt) to Markdown format for easy consumption by Large Language Models (LLMs).

## Features

- **Multi-format Support**: Upload and convert DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX, and TXT files
- **Side-by-side Preview**: View original document info alongside converted Markdown
- **Section Highlighting**: Hover over Markdown sections to see corresponding content highlighted
- **Copy to Clipboard**: Easy copying of converted Markdown for use with LLMs
- **Drag & Drop Interface**: Simple file upload with drag-and-drop support
- **Real-time Conversion**: Fast server-side processing and conversion

## Architecture

### Frontend (React)
- Modern React application with hooks
- React Dropzone for file uploads
- React Markdown for rendering converted content
- Responsive design with CSS Grid/Flexbox

### Backend (Node.js/Express)
- RESTful API for file upload and conversion
- Multer for handling multipart file uploads
- Specialized converters for each file type:
  - **DOCX/DOC**: Mammoth.js for Word document parsing
  - **PDF**: pdf-parse for PDF text extraction
  - **XLSX/XLS**: SheetJS for Excel spreadsheet processing
  - **PPTX/PPT**: LibreOffice integration (fallback approach)
  - **TXT**: Direct text processing with smart formatting

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd convert
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Start the development servers:
```bash
npm start
```

This will start both the backend server (port 3001) and frontend development server (port 3000).

### Manual Setup

If you prefer to start services individually:

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## Usage

1. Open your browser to `http://localhost:3000`
2. Drag and drop a supported file or click to browse
3. Wait for conversion to complete
4. View the side-by-side preview
5. Hover over Markdown sections to see highlighting
6. Click "Copy" to copy the Markdown to your clipboard
7. Paste into your favorite LLM for processing

## Supported File Types

| Format | Extension | Status | Notes |
|--------|-----------|--------|-------|
| Word | .doc, .docx | ✅ Full Support | Preserves formatting, tables, lists |
| PDF | .pdf | ✅ Full Support | Text extraction, basic formatting |
| Excel | .xls, .xlsx | ✅ Full Support | Converts to Markdown tables |
| PowerPoint | .ppt, .pptx | ⚠️ Limited | Requires LibreOffice for full support |
| Text | .txt | ✅ Full Support | Smart heading detection |

## API Endpoints

### POST /api/upload
Upload and convert a file to Markdown.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: File upload with key 'file'

**Response:**
```json
{
  "success": true,
  "filename": "document.docx",
  "markdown": "# Converted content...",
  "sections": [
    {
      "id": "section-1",
      "originalText": "Original text",
      "markdownStart": 0,
      "markdownEnd": 100,
      "type": "heading"
    }
  ],
  "fileType": ".docx"
}
```

## Development

### Project Structure
```
convert/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.js
│   │   │   └── PreviewPane.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── backend/           # Express API server
│   ├── converters/    # File conversion modules
│   │   ├── docxConverter.js
│   │   ├── pdfConverter.js
│   │   ├── xlsxConverter.js
│   │   ├── pptxConverter.js
│   │   └── txtConverter.js
│   ├── uploads/       # Temporary file storage
│   ├── server.js      # Main server file
│   └── package.json
└── package.json       # Root package.json
```

### Adding New File Types

1. Create a new converter in `backend/converters/`
2. Implement the `convert(filePath)` function
3. Return an object with `markdown` and `sections` properties
4. Add the file type to the server's route handler
5. Update the frontend's accepted file types

### Environment Variables

Create `.env` files in backend/ for configuration:

```env
PORT=3001
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
Convert almost any file format into .md for easy ingestion with LLM
