export class OperationalError extends Error {
  statusCode: number
  data: any
  isOperational = true

  constructor(message: string, statusCode: number, data = {}) {
    super(message)
    this.statusCode = statusCode
    this.data = data
    Error.captureStackTrace(this.constructor)
  }
}
