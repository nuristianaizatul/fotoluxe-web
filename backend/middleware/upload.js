// middleware/upload.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pastikan folder uploads tersedia di middleware/uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let prefix = '';
    
    // Tentukan prefix berdasarkan jenis file
    if (file.fieldname === 'photo') {
      prefix = 'profile-';
    } else if (file.fieldname === 'image') {
      prefix = 'product-';
    } else {
      prefix = file.fieldname + '-'; // untuk ktp dan selfie
    }
    
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Hanya file gambar (JPEG/JPG/PNG/WEBP) yang diperbolehkan'));
};

// Upload untuk single file
export const upload = multer({ 
  storage: storage,
  fileFilter: imageFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Upload untuk multiple files
export const uploadOrderFiles = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).fields([
  { name: 'ktp', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]);

// Penanganan error upload
export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Ukuran file terlalu besar. Maksimal 5MB' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
};

