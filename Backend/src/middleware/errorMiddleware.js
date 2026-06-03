// errorMiddleware.js

const globalErrorHandler = (err, req, res, next) => {
  // 1. Fallback values if the error doesn't have a status code or message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again later.';

  // 2. Log the error for the developer (optional but helpful)
  console.error('💥 Error Intercepted:', err);

  // 3. Send a unified, structured JSON response to the frontend
  res.status(statusCode).json({
    status: statusCode >= 400 && statusCode < 500 ? 'fail' : 'error',
    message: message,
    // Show the detailed stack trace ONLY during local development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default globalErrorHandler;