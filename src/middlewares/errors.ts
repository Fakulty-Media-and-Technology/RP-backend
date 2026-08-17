import { Request, Response, NextFunction } from 'express'
import { OperationalError } from '../utils/OperationalError'
import { sendResponse } from '../utils/responder'

export class ErrorMiddleware {
  static allErrors = (error: any, _: Request, res: Response, __: NextFunction) => {
    switch (error.name) {
      case 'TokenExpiredError':
        error = new OperationalError('Expired session. Please login', 401)
        break

      case 'JsonWebTokenError':
        error = new OperationalError('Invalid credentials. Please login', 401)
        break

      case 'MongooseError':
        error = new OperationalError('Network Error', 502)
        break

      case 'MongoNetworkTimeoutError':
        error = new OperationalError('Database Connection error', 502)
        break

      case 'MongoServerError':
        if (error.code === 11000) {
          const entries = Object.entries(error.keyValue)

          let keyValues = ''

          entries.forEach(([key, value], index) => {
            const keyValueStr = `${key} : ${value}`
            keyValues += index === entries.length - 1 ? keyValueStr : keyValueStr + ' AND '
          })

          const message = `<${keyValues}> ${entries.length === 1 ? 'is' : 'are'} associated with another record.`
          error = new OperationalError(message, 400)
          break
        }
        default:
        console.log('🛑500 ERROR', error)

        error = new OperationalError(
          error.message || 'Unkown application error',
          error.statusCode || 500,
        )

        break
    }

    const isOperationalError = error instanceof OperationalError
    const message = isOperationalError ? error.message : 'something went wrong please try again'
    const statusCode = isOperationalError ? error.statusCode : 500
    statusCode.toString().startsWith('5') || !isOperationalError  && console.log('Express Error middleware Middleware🛑', error)

    sendResponse({
      res,
      message,
      statusCode,
    })

  }

  static wildRoute = ({ method, originalUrl }: Request, _: Response, next: NextFunction) => {
    return next(
      new OperationalError(
        `${method.toUpperCase()} ${originalUrl} is not implemented on this server`,
        501,
      ),
    )
  }
}
