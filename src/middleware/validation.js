import { validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

export const validateFileUpload = (allowedTypes = [], maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const errors = [];

    Object.keys(req.files).forEach(fieldName => {
      const files = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];

      files.forEach(file => {
        // Check file type
        if (allowedTypes.length > 0) {
          const isAllowed = allowedTypes.some(type => {
            if (type.includes('/')) {
              return file.mimetype === type;
            }
            return file.mimetype.startsWith(type);
          });

          if (!isAllowed) {
            errors.push(`File type ${file.mimetype} is not allowed for ${fieldName}`);
          }
        }

        // Check file size
        if (file.size > maxSize) {
          errors.push(`File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        }
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors,
      });
    }

    next();
  };
};