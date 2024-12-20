import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { connectMongoDB } from './utils/connectDB'
import { socketChat } from './socket/socketEvents'
import { CronTasks } from './cron'
import { reeplayApp } from './app'

import env from './env'
import { nmsLivestream } from './livestream/nms'
import { Assets } from './utils/Assets'
import { FileHandler } from './utils/FileHandler'

const { PORT } = env

const app = reeplayApp()
const server = createServer(app)
const cronJobs = new CronTasks()

const io = new Server(server, {
  cors: { origin: '*' },
})

const makeMediDirectories = () => {
  Object.values(Assets.rootMediaDirs).forEach(dir => FileHandler.createDirIfNotExistSync(dir))
}

;(async () => {
  makeMediDirectories()
  console.log(await connectMongoDB())

  server.listen(PORT, async () => {
    console.log(`Node Server Listening on port: ${PORT} >>>>>> [http://localhost:${PORT}]`)

    nmsLivestream.register()
    socketChat(io)
    cronJobs.start()
  })
})()
