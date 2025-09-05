import { validationResult, body } from 'express-validator';

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

// Custom validation middleware for mailer
export const validateMailerRequest = (req, res, next) => {
  const { recipientType, recipients, singleEmail, emailProvider, subject, message } = req.body;
  const errors = [];

  // Validate required fields
  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    errors.push({ field: 'subject', message: 'Subject is required and must be a non-empty string' });
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errors.push({ field: 'message', message: 'Message is required and must be a non-empty string' });
  }

  if (!recipientType || !['registrants', 'single'].includes(recipientType)) {
    errors.push({ field: 'recipientType', message: 'Recipient type must be either "registrants" or "single"' });
  }

  if (!emailProvider || !['gmail', 'outlook'].includes(emailProvider)) {
    errors.push({ field: 'emailProvider', message: 'Email provider must be either "gmail" or "outlook"' });
  }

  // Validate based on recipient type
  if (recipientType === 'single') {
    if (!singleEmail || typeof singleEmail !== 'string' || !singleEmail.includes('@')) {
      errors.push({ field: 'singleEmail', message: 'Valid email address is required for single recipient' });
    }
  } else if (recipientType === 'registrants') {
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      errors.push({ field: 'recipients', message: 'At least one recipient group must be selected' });
    }
  }

  // Validate string lengths
  if (subject && subject.length > 200) {
    errors.push({ field: 'subject', message: 'Subject must be 200 characters or less' });
  }

  if (message && message.length > 10000) {
    errors.push({ field: 'message', message: 'Message must be 10,000 characters or less' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Validation for test email
export const validateTestEmailRequest = (req, res, next) => {
  const { email, subject, message } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    errors.push({ field: 'subject', message: 'Subject is required and must be a non-empty string' });
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errors.push({ field: 'message', message: 'Message is required and must be a non-empty string' });
  }

  if (subject && subject.length > 200) {
    errors.push({ field: 'subject', message: 'Subject must be 200 characters or less' });
  }

  if (message && message.length > 10000) {
    errors.push({ field: 'message', message: 'Message must be 10,000 characters or less' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Validation for payment order creation
export const validatePaymentOrderRequest = (req, res, next) => {
  const { userId, registrationId, amount, currency } = req.body;
  const errors = [];

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    errors.push({ field: 'userId', message: 'User ID is required and must be a non-empty string' });
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount is required and must be a positive number' });
  }

  if (currency && !['INR'].includes(currency)) {
    errors.push({ field: 'currency', message: 'Currency must be INR' });
  }

  if (registrationId && (typeof registrationId !== 'string' || registrationId.trim().length === 0)) {
    errors.push({ field: 'registrationId', message: 'Registration ID must be a non-empty string if provided' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Validation for payment verification
export const validatePaymentVerificationRequest = (req, res, next) => {
  const { paymentId, razorpayPaymentId, razorpaySignature } = req.body;
  const errors = [];

  if (!paymentId || typeof paymentId !== 'string' || paymentId.trim().length === 0) {
    errors.push({ field: 'paymentId', message: 'Payment ID is required and must be a non-empty string' });
  }

  if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string' || razorpayPaymentId.trim().length === 0) {
    errors.push({ field: 'razorpayPaymentId', message: 'Razorpay Payment ID is required and must be a non-empty string' });
  }

  if (!razorpaySignature || typeof razorpaySignature !== 'string' || razorpaySignature.trim().length === 0) {
    errors.push({ field: 'razorpaySignature', message: 'Razorpay Signature is required and must be a non-empty string' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

// Validation for payment refund
export const validatePaymentRefundRequest = (req, res, next) => {
  const { amount, reason } = req.body;
  const errors = [];

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount is required and must be a positive number' });
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    errors.push({ field: 'reason', message: 'Reason is required and must be a non-empty string' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
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