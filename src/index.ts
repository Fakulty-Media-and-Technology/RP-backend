import { Server } from 'socket.io'
import { createServer } from 'node:http'

import { CronTasks } from './cron'
import { reeplayApp } from './app'

import env from './env'
import { Assets } from './utils/Assets'
import { MediaStream } from './livestream/nms'
import { FileHandler } from './utils/FileHandler'
import { connectMongoDB } from './utils/connectDB'
import { socketChat } from './socket/socketEvents'
import mongoose from 'mongoose'

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
  const mongoDBConn = connectMongoDB()

  makeMediDirectories()

  console.log(await mongoDBConn)

  server.listen(PORT, async () => {
    console.log(`Node Server Listening on port: ${PORT} >>>>>> [http://localhost:${PORT}]`)

    socketChat(io)
    cronJobs.start()
    MediaStream.launch()
  })
})()

server.on('close', async () => {
  console.error('reeplay server is closed: ..... 😢😢......')
  process.exit()
})

// do not handle SIGKILL and SIGINT
process
  .on('uncaughtException', shutdown('uncaughtException'))
  .on('unhandledRejection', shutdown('unhandledRejection'))

function shutdown(exception: string) {
  return async (...args: any[]) => {
    setTimeout(() => process.exit(1), 100).unref()
    console.error('Server shutdown routine initiated for exception >>>> 🛑', exception)
    console.error('Reasons >>>> 🛑:', args.join(' | '))

    // clean up
    io.close()
    cronJobs.stop()
    await mongoose.connection.close(true)
    server.close() // triggers on server.on('close')
  }
}
