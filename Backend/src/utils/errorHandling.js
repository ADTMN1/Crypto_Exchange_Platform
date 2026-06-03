class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks errors we actually expect (like validation or auth)

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;