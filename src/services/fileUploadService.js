import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

class FileUploadService {
  constructor() {
    this.uploadDir = 'uploads';
    this.ensureUploadDirectories();
  }

  ensureUploadDirectories() {
    const directories = [
      'uploads',
      'uploads/documents',
      'uploads/images',
      'uploads/resources',
      'uploads/committee-logos',
      'uploads/background-guides',
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  getStorage(destination = 'uploads/documents') {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, destination);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  getFileFilter(allowedTypes = []) {
    return (req, file, cb) => {
      if (allowedTypes.length === 0) {
        return cb(null, true);
      }

      const isAllowed = allowedTypes.some(type => {
        if (type.includes('/')) {
          return file.mimetype === type;
        }
        return file.mimetype.startsWith(type);
      });

      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`), false);
      }
    };
  }

  createUploadMiddleware(options = {}) {
    const {
      destination = 'uploads/documents',
      allowedTypes = ['image', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      maxSize = 10 * 1024 * 1024, // 10MB
      maxFiles = 1,
    } = options;

    return multer({
      storage: this.getStorage(destination),
      fileFilter: this.getFileFilter(allowedTypes),
      limits: {
        fileSize: maxSize,
        files: maxFiles,
      },
    });
  }

  // Document upload middleware
  documentUpload = this.createUploadMiddleware({
    destination: 'uploads/documents',
    allowedTypes: ['image', 'application/pdf'],
    maxSize: 10 * 1024 * 1024,
  });

  // Image upload middleware
  imageUpload = this.createUploadMiddleware({
    destination: 'uploads/images',
    allowedTypes: ['image'],
    maxSize: 5 * 1024 * 1024,
  });

  // Resource upload middleware
  resourceUpload = this.createUploadMiddleware({
    destination: 'uploads/resources',
    allowedTypes: ['image', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video'],
    maxSize: 50 * 1024 * 1024, // 50MB for resources
  });

  // Committee logo upload middleware
  logoUpload = this.createUploadMiddleware({
    destination: 'uploads/committee-logos',
    allowedTypes: ['image'],
    maxSize: 2 * 1024 * 1024,
  });

  // Background guide upload middleware
  backgroundGuideUpload = this.createUploadMiddleware({
    destination: 'uploads/background-guides',
    allowedTypes: ['application/pdf'],
    maxSize: 20 * 1024 * 1024,
  });

  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (error) {
      console.error('File deletion failed:', error);
      return { success: false, error: error.message };
    }
  }

  getFileUrl(filePath) {
    return `${process.env.VITE_API_URL}/${filePath}`;
  }

  validateFile(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    // Check file type
    if (allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => {
        if (type.includes('/')) {
          return file.mimetype === type;
        }
        return file.mimetype.startsWith(type);
      });

      if (!isAllowed) {
        errors.push(`File type ${file.mimetype} is not allowed`);
      }
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size ${file.size} exceeds maximum allowed size ${maxSize}`);
    }

    return errors;
  }

  getFileInfo(file) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      url: this.getFileUrl(file.path),
    };
  }
}

export default new FileUploadService();