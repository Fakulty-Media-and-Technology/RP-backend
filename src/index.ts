import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { connectMongoDB } from './utils/connectDB'
import { socketChat } from './socket/socketEvents'
import { CronTasks } from './cron'
import { reeplayApp } from './app'

import env from './env'
// import { nmsLivestream } from './livestream/nms'

const { PORT } = env

const app = reeplayApp()
const server = createServer(app)
const cronJobs = new CronTasks()

const io = new Server(server, {
  cors: { origin: '*' },
})


;(async () => {
  const mongoDBConnectionRes = await connectMongoDB()
  console.log(mongoDBConnectionRes)

  server.listen(PORT, async () => {
    console.log(`Node Server Listening on port: ${PORT} >>>>>> [http://localhost:${PORT}]`)

    socketChat(io)
    cronJobs.start()
  })
})()
