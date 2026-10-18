
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message:
      status >= 500
        ? "Internal server error"
        : err.message || "Request failed",
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = {
  notFound,
  errorHandler,
};
