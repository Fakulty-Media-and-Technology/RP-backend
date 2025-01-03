import { Request, Response, NextFunction } from 'express'
import { OperationalError } from '../utils/OperationalError'
import { sendResponse } from '../utils/responder'
// import env from '../env'

export class ErrorMiddleware {
  static allErrors = (err: unknown, _: Request, res: Response, __: NextFunction) => {
    // TODO: REMOVE AFTER MVP
    console.dir({ '🛑🛑error': err }, { depth: null })

    if (err instanceof OperationalError) {
      sendResponse({
        res,
        data: err,
        message: err.message,
        statusCode: err.statusCode,
      })

      return
    }

    // this can be made very elaborate

    sendResponse({
      res,
      message: 'something went wrong. Please try again',
      statusCode: 500,
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
