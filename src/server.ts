import { createServer } from 'node:http'
import express from 'express'
import { connectMongoDB } from './utils/connectDB'
import env from './env'

const { PORT } = env

;(async () => {
  const mongoDBConnectionRes = await connectMongoDB()
  console.log(mongoDBConnectionRes)

  const server = createServer(express())

  server.listen(PORT, () => {
    console.log(`Server is listening oo port ${PORT}`)
  })
})()
