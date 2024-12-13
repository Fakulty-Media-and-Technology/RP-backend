import { Response } from 'express'

type SendResponseParams = {
  res: Response
  statusCode?: number
  data?: any
  message?: string
}

const between = (value: number, min: number, max: number) => value >= min && value <= max

const getMessagePrefixFromStatusCode = (statusCode: number) => {
  switch (true) {
    case between(statusCode, 200, 299):
      return 'Request Successful:'
    case between(statusCode, 400, 402):
      return '`Invalid Request:'
    case between(statusCode, 403, 499):
      return 'Request Failed:'
    case between(statusCode, 500, 600):
      return 'Server Error:'
    default:
      return ':'
  }
}

export const sendResponse = (params: SendResponseParams) => {
  const { statusCode = 200, data = null, message = 'success', res } = params

  res.status(statusCode).json({
    status: statusCode,
    message: getMessagePrefixFromStatusCode(statusCode) + ' ' + message,
    data,
  })
}
