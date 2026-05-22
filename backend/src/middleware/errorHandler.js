function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  const payload = {
    error: status === 500 ? 'Errore interno del server.' : error.message
  };

  if (process.env.NODE_ENV !== 'production' && status === 500) {
    payload.stack = error.stack;
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
