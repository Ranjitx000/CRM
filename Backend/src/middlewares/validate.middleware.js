const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Validation failed',
      error: 'BadRequest',
      details: err.errors
    });
  }
};

module.exports = validate;
