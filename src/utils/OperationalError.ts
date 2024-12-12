export class OperationalError extends Error {
  statusCode: number
  isOperational = true

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    Error.captureStackTrace(this.constructor)
  }
}
