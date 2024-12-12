import { createServer } from 'node:http'
import express from 'express'
import { connectMongoDB } from './utils/connectDB'

const port = 5050

;(async () => {
  const mongoDBConnectionRes = await connectMongoDB()
  console.log(mongoDBConnectionRes)

  const server = createServer(express())

  server.listen(port, () => {
    console.log(`Server is listening oo port ${port}`)
  })
})()
