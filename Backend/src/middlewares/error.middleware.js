const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  // AppError
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      error: err.name || 'Error',
      details: []
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    return res.status(400).json({
      statusCode: 400,
      message: 'Validation Error',
      error: 'BadRequest',
      details
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      statusCode: 409,
      message: `Duplicate value for ${field}`,
      error: 'Conflict',
      details: []
    });
  }

  // Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid id format',
      error: 'BadRequest',
      details: []
    });
  }

  // Default server error
  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
    error: 'InternalServerError',
    details: []
  });
};

module.exports = errorMiddleware;
