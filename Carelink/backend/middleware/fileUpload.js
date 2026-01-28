// middleware/fileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const { logSecurityEvent } = require('../utils/logger');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

// File type validation using magic numbers
const FILE_SIGNATURES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]]
};

function checkMagicNumber(fileBuffer, mimeType) {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return false;
  
  for (const signature of signatures) {
    let match = true;
    for (let i = 0; i < signature.length; i++) {
      if (fileBuffer[i] !== signature[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

function sanitizeFilename(filename) {
  filename = path.basename(filename);
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  if (filename.length > 255) {
    const ext = path.extname(filename);
    const name = filename.substring(0, 255 - ext.length);
    filename = name + ext;
  }
  
  if (filename.startsWith('.')) {
    filename = '_' + filename;
  }
  
  return filename;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(32).toString('hex');
    const ext = path.extname(sanitizeFilename(file.originalname)).toLowerCase();
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }
    
    cb(null, `${randomName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedMimes.includes(file.mimetype)) {
    logSecurityEvent('INVALID_FILE_TYPE', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      ip: req.ip
    });
    return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
  
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  if (!allowedExtensions.includes(ext)) {
    logSecurityEvent('INVALID_FILE_EXTENSION', {
      extension: ext,
      originalname: file.originalname,
      ip: req.ip
    });
    return cb(new Error('Invalid file extension'), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
    fields: 20,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024
  },
  fileFilter: fileFilter
});

exports.validateUploadedFile = async (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next();
  }

  const files = req.files || [req.file];

  try {
    for (const file of files) {
      if (!file || !file.path) continue;

      if (!fs.existsSync(file.path)) {
        logSecurityEvent('FILE_NOT_FOUND', {
          filename: file.filename,
          ip: req.ip
        });
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found'
        });
      }

      const fileBuffer = fs.readFileSync(file.path);
      
      if (!checkMagicNumber(fileBuffer, file.mimetype)) {
        fs.unlinkSync(file.path);
        logSecurityEvent('FILE_SIGNATURE_MISMATCH', {
          filename: file.originalname,
          mimetype: file.mimetype,
          ip: req.ip,
          userId: req.user?._id
        });
        return res.status(400).json({
          success: false,
          message: 'File content does not match file extension. Possible security threat detected.'
        });
      }

      const filename = file.originalname;
      const parts = filename.split('.');
      if (parts.length > 2) {
        fs.unlinkSync(file.path);
        logSecurityEvent('DOUBLE_EXTENSION_DETECTED', {
          filename,
          ip: req.ip,
          userId: req.user?._id
        });
        return res.status(400).json({
          success: false,
          message: 'Multiple file extensions not allowed. Possible security threat detected.'
        });
      }

      try {
        const image = sharp(fileBuffer);
        const metadata = await image.metadata();

        const MAX_WIDTH = 5000;
        const MAX_HEIGHT = 5000;
        const MAX_PIXELS = MAX_WIDTH * MAX_HEIGHT;

        if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
          logSecurityEvent('IMAGE_BOMB_ATTEMPT', {
            width: metadata.width,
            height: metadata.height,
            filename: file.originalname,
            ip: req.ip,
            userId: req.user?._id
          });

          await sharp(file.path)
            .resize(MAX_WIDTH, MAX_HEIGHT, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(file.path + '.resized');

          fs.unlinkSync(file.path);
          fs.renameSync(file.path + '.resized', file.path);
        }

        if (metadata.width * metadata.height > MAX_PIXELS) {
          await sharp(file.path)
            .resize(MAX_WIDTH, MAX_HEIGHT, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(file.path + '.resized');

          fs.unlinkSync(file.path);
          fs.renameSync(file.path + '.resized', file.path);
        }

        await sharp(file.path)
          .rotate()
          .withMetadata(false)
          .toFile(file.path + '.stripped');

        fs.unlinkSync(file.path);
        fs.renameSync(file.path + '.stripped', file.path);

        const stats = fs.statSync(file.path);
        if (stats.size > 5 * 1024 * 1024) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            message: 'File size exceeds 5MB limit after processing'
          });
        }

      } catch (sharpError) {
        console.error('Sharp processing error:', sharpError);
        fs.unlinkSync(file.path);
        logSecurityEvent('INVALID_IMAGE_FILE', {
          filename: file.originalname,
          error: sharpError.message,
          ip: req.ip,
          userId: req.user?._id
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid or corrupted image file'
        });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(400).json({
          success: false,
          message: 'File validation failed'
        });
      }
    }

    next();
    
  } catch (error) {
    console.error('File validation error:', error);
    
    const files = req.files || [req.file];
    files.forEach(file => {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    
    logSecurityEvent('FILE_VALIDATION_ERROR', {
      error: error.message,
      ip: req.ip,
      userId: req.user?._id
    });

    res.status(500).json({
      success: false,
      message: 'File validation failed'
    });
  }
};

exports.uploadSingle = upload.single('image');
exports.uploadMultiple = upload.array('images', 5);

exports.cleanOldUploads = async () => {
  try {
    const Product = require('../models/Product');
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    
    const products = await Product.find().select('images').lean();
    const usedImages = new Set();
    products.forEach(product => {
      if (product.images) {
        product.images.forEach(img => {
          const filename = path.basename(img);
          usedImages.add(filename);
        });
      }
    });

    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        console.error('Error reading uploads directory:', err);
        return;
      }

      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) return;

          const isOld = Date.now() - stats.mtimeMs > maxAge;
          const isUnused = !usedImages.has(file);

          if (isOld && isUnused) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error('Error deleting old file:', err);
              } else {
                console.log(`Deleted orphaned file: ${file}`);
                logSecurityEvent('ORPHANED_FILE_DELETED', {
                  filename: file,
                  age: Date.now() - stats.mtimeMs
                });
              }
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Error cleaning old uploads:', error);
  }
};

if (process.env.NODE_ENV === 'production') {
  setInterval(exports.cleanOldUploads, 24 * 60 * 60 * 1000);
}

exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds 5MB limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Maximum 5 files allowed';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      default:
        message = err.message;
    }
    
    logSecurityEvent('MULTER_ERROR', {
      code: err.code,
      message: err.message,
      ip: req.ip,
      userId: req.user?._id
    });
    
    return res.status(400).json({
      success: false,
      message
    });
  }
  
  if (err) {
    logSecurityEvent('FILE_UPLOAD_ERROR', {
      error: err.message,
      ip: req.ip,
      userId: req.user?._id
    });
    
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }
  
  next();
};

