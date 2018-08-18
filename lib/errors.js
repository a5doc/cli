'use strict';

class AppError extends Error {
  constructor(message, e) {
    super(message);
    if (e instanceof Error) {
      this.stack += '\nCaused by: ' + e.message;
      if (e.stack) {
        this.stack += '\n' + e.stack;
      }
      if (!message) {
        message = e.name;
      }
    }
    this.name = 'AppError';
    this.message = message;
  }
}
module.exports = AppError;
