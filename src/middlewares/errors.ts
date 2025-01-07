import { Request, Response, NextFunction } from 'express'
import { OperationalError } from '../utils/OperationalError'
import { sendResponse } from '../utils/responder'
// import env from '../env'

// const isObjectLike = (obj: unknown) => Object.prototype.toString.call(obj) === '[object Object]'

export class ErrorMiddleware {
  static allErrors = (error: any, _: Request, res: Response, __: NextFunction) => {
    /**
     * Current patch implementation.
     * Considerate planning should be considered for error handling and this should be greatly improved
     */
    const isOperationalError = error instanceof OperationalError

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

      case 'MongoServerError':
        if (error.code === 11000) {
          const message = `${Object.values(error.keyValue)[0]} is associated with another document in the table.`
          error = new OperationalError(message, 400)
          break
        }

        error = new OperationalError('Unkonwn database error', 502)
        break
      default:
        error = isOperationalError
          ? error
          : new OperationalError(
              error.message || 'Unkown application error',
              error.statusCode || 500,
            )

        break
    }

    const message = isOperationalError ? error.message : 'something went wrong please try again'
    const statusCode = isOperationalError ? error.statusCode : 500

    sendResponse({
      res,
      message,
      statusCode,
    })

    !isOperationalError && console.log('Express Error middleware Middleware🛑', error)
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
