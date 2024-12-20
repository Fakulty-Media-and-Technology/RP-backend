import express, { Request, Response } from 'express'

import cors from 'cors'
import path from 'node:path'
import fileUpload, { Options as FileUploadOptions } from 'express-fileupload'
import { v1Router } from './routes/index'
import { ErrorMiddleware } from './middlewares/errors'

// const { sendPushNotification, sendPush } = require('./notifications/notification')

const fileUploadOptions: FileUploadOptions = {
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },
  useTempFiles: false,
}

const devTestRoute = (_: Request, res: Response) => {
  res.status(200).json({
    status: 200,
    message: 'REEPLAY API BASE_URL',
  })
}

export const reeplayApp = () => {
  const app = express()

  app.use(express.json({ limit: '10gb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cors({ origin: '*' }))
  app.use(fileUpload(fileUploadOptions))

  app.use('/static/images', express.static(path.join(__dirname, 'public/static')))

  app.get('/', devTestRoute)
  app.use('/api/v1', v1Router)
  app.use(ErrorMiddleware.wildRoute)
  app.use(ErrorMiddleware.allErrors)

  return app
}
