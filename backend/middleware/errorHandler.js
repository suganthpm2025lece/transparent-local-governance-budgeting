const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware to check express-validator results and return 400 with field errors.
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return next(new AppError(formatted[0].message, 400, formatted));
  }
  next();
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyPattern || {});
    if (fields.includes('proposal') && fields.includes('citizen')) {
      message = 'You have already voted for this proposal.';
    } else if (fields.includes('email')) {
      message = 'An account with this email address already exists.';
    } else {
      message = `Duplicate value for ${fields.join(', ') || 'unique field'}.`;
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const msgs = Object.values(err.errors).map((e) => e.message);
    message = msgs[0] || 'Validation failed';
    details = msgs;
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid identifier provided for ${err.path || 'resource'}.`;
  }

  // Multer file upload error
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file exceeds the 5MB size limit.' : err.message;
  }

  if (process.env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error('[ServerError]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { validateRequest, notFoundHandler, errorHandler };
