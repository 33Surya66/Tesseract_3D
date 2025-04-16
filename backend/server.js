const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());

app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep the original file extension but generate unique name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedFormats = ['.glb', '.gltf', '.obj', '.stl'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFormats.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed formats: ' + allowedFormats.join(', ')));
    }
  }
});

// Serve files with Content-Disposition header for download
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  // Send file
  res.download(filePath);
});

app.get('/ping', (req,res) => {
  res.send("hi")
});
  
// Upload endpoint
app.post('/upload', (req, res) => {
  upload.single('model')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Verify file was actually saved
      const filePath = path.join(uploadDir, req.file.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(500).json({ error: 'File failed to save' });
      }

      // Generate both view and download URLs
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const viewUrl = `${baseUrl}/uploads/${req.file.filename}`;
      const downloadUrl = `${baseUrl}/download/${req.file.filename}`;
      
      res.json({
        success: true,
        viewUrl,     // URL to view/load the file directly
        downloadUrl, // URL to download the file
        filename: req.file.filename,
        originalName: req.file.originalname
      });
    } catch (error) {
      console.error('Upload processing error:', error);
      res.status(500).json({ error: 'File upload processing failed' });
    }
  });
});

// Serve static files from uploads directory (for viewing)
app.use('/uploads', express.static(uploadDir));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload directory: ${uploadDir}`);
});
