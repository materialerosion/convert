const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const sharp = require('sharp');

// Import converters
const docxConverter = require('./converters/docxConverter');
const pdfConverter = require('./converters/pdfConverter');
const xlsxConverter = require('./converters/xlsxConverter');
const pptxConverter = require('./converters/pptxConverter');
const txtConverter = require('./converters/txtConverter');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from temp-images directory with CORS headers
app.use('/images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, 'temp-images')));

// Create temp-images directory if it doesn't exist
const tempImagesDir = path.join(__dirname, 'temp-images');
if (!fs.existsSync(tempImagesDir)) {
  fs.mkdirSync(tempImagesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      '.doc', '.docx', '.pdf', '.xls', '.xlsx', 
      '.ppt', '.pptx', '.txt'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Helper function to convert document to image
async function convertToImage(filePath, fileExt, originalName) {
  const timestamp = Date.now();
  const imageBaseName = `${timestamp}-${path.parse(originalName).name}`;
  
  try {
    switch (fileExt) {
      case '.pdf':
        // Convert PDF to image using ImageMagick directly
        const outputPath = path.join(tempImagesDir, `${imageBaseName}.png`);
        
        return new Promise((resolve, reject) => {
          const command = `convert "${filePath}[0]" -density 150 -quality 90 "${outputPath}"`;
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error('PDF conversion error:', error);
              resolve(null);
            } else if (fs.existsSync(outputPath)) {
              resolve(`/images/${imageBaseName}.png`);
            } else {
              resolve(null);
            }
          });
        });
        break;
        
      case '.docx':
      case '.doc':
        // For now, we'll skip image conversion for DOCX
        // In a full implementation, you'd use LibreOffice or similar
        return null;
        
      case '.txt':
        // Create a simple image from text content
        const textContent = fs.readFileSync(filePath, 'utf8');
        const textImagePath = path.join(tempImagesDir, `${imageBaseName}.png`);
        
        // Create a simple text image using Sharp
        const textBuffer = Buffer.from(`
          <svg width="800" height="1200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white"/>
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" 
                   style="font-family: monospace; font-size: 12px; padding: 20px; 
                          white-space: pre-wrap; word-wrap: break-word;">
                ${textContent.substring(0, 5000)}${textContent.length > 5000 ? '...' : ''}
              </div>
            </foreignObject>
          </svg>
        `);
        
        await sharp(textBuffer)
          .png()
          .toFile(textImagePath);
          
        return `/images/${path.basename(textImagePath)}`;
        
      default:
        return null;
    }
  } catch (error) {
    console.error('Image conversion error:', error);
    return null;
  }
  
  return null;
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'File Converter API is running!' });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    let markdown = '';
    let sections = [];
    let imageUrl = null;

    // Convert to image first (if supported)
    try {
      imageUrl = await convertToImage(filePath, fileExt, req.file.originalname);
    } catch (imgError) {
      console.warn('Image conversion failed:', imgError.message);
    }

    // Convert based on file type
    switch (fileExt) {
      case '.docx':
      case '.doc':
        const docResult = await docxConverter.convert(filePath);
        markdown = docResult.markdown;
        sections = docResult.sections;
        break;
      case '.pdf':
        const pdfResult = await pdfConverter.convert(filePath);
        markdown = pdfResult.markdown;
        sections = pdfResult.sections;
        break;
      case '.xlsx':
      case '.xls':
        const xlsxResult = await xlsxConverter.convert(filePath);
        markdown = xlsxResult.markdown;
        sections = xlsxResult.sections;
        break;
      case '.pptx':
      case '.ppt':
        const pptxResult = await pptxConverter.convert(filePath);
        markdown = pptxResult.markdown;
        sections = pptxResult.sections;
        break;
      case '.txt':
        const txtResult = await txtConverter.convert(filePath);
        markdown = txtResult.markdown;
        sections = txtResult.sections;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      filename: req.file.originalname,
      markdown: markdown,
      sections: sections,
      fileType: fileExt,
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'File conversion failed',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});