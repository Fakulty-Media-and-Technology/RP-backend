import { Response } from 'express'

type SendResponseParams = {
  res: Response
  statusCode: number
  data: any
  message: string
}

const between = (value: number, min: number, max: number) => value >= min && value <= max

export const sendResponse = ({ statusCode, ...params }: SendResponseParams) => {
  let messagePrefix: string = ':'

  if (between(statusCode, 400, 402)) {
    messagePrefix = '`Invalid Request:'
  } else if (between(statusCode, 403, 499)) {
    messagePrefix = 'Request Failed:'
  } else if (between(statusCode, 500, 600)) {
    messagePrefix = 'Server Error:'
  } else if (between(statusCode, 200, 299)) {
    messagePrefix = 'Request Successful:'
  }

  params.res.status(statusCode).json({
    status: statusCode,
    message: messagePrefix + ' ' + params.message,
    data: params.data,
  })
}
