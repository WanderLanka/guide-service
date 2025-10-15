function notFound(req, res, next) {
  res.status(404).json({ success: false, error: 'Route not found' });
}

function errorConverter(err, req, res, next) {
  next(err);
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, error: message });
}

module.exports = { notFound, errorConverter, errorHandler };
