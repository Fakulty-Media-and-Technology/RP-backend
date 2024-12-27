import path from 'node:path'
import express, { Request, Response } from 'express'
import cors from 'cors'
import morgan from 'morgan'

import { v1Router } from './routes/index'
import { ErrorMiddleware } from './middlewares/errors'
import env from './env'

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

  app.use('/static/images', express.static(path.join(__dirname, 'public/static')))

  !env.IS_PROD && app.use(morgan('dev'))

  app.get('/', devTestRoute)
  app.use('/api/v1', v1Router)
  app.use(ErrorMiddleware.wildRoute)
  app.use(ErrorMiddleware.allErrors)

  return app
}
