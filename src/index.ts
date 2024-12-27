import { Server } from 'socket.io'
import mongoose from 'mongoose'
import { createServer } from 'node:http'

import { CronTasks } from './cron'
import { reeplayApp } from './app'

import env from './env'
import { Assets } from './utils/Assets'
import { MediaStream } from './livestream/nms'
import { FileHandler } from './utils/FileHandler'
import { connectMongoDB } from './utils/connectDB'
import { socketChat } from './socket/socketEvents'

const { PORT } = env

const app = reeplayApp()
const server = createServer(app)
const cronJobs = new CronTasks()
const mediaStream = new MediaStream()

const io = new Server(server, {
  cors: { origin: '*' },
})

const makeMediaDirectories = () => {
  Object.values(Assets.rootMediaDirs).forEach(dir => FileHandler.createDirIfNotExistSync(dir))
}

makeMediaDirectories()

connectMongoDB().then(conn => {
  console.log(conn)

  server.listen(PORT, async () => {
    console.log(`Node Server Listening on port: ${PORT} >>>>>> [http://localhost:${PORT}]`)

    socketChat(io)
    cronJobs.start()
    mediaStream.initiate()
  })
})

server.on('close', async () => {
  console.error('reeplay server is closed: ..... 😢😢......')
  process.exit()
})

// do not handle SIGKILL and SIGSTOP
process
  .on('uncaughtException', shutdown('uncaughtException'))
  .on('unhandledRejection', shutdown('unhandledRejection'))

function shutdown(exception: string) {
  return async (...args: any[]) => {
    setTimeout(() => process.exit(1), 400).unref()
    console.error('Server shutdown routine initiated for exception >>>> 🛑', exception)
    console.error('Reasons >>>> 🛑:', args.join(' | '))

    // *********** clean up
    io.close()
    console.log('IO Websocket closed')
    cronJobs.stop()
    mediaStream.close()
    await mongoose.connection.close(true)
    console.log('Mongoose connection closed')

    server.close()
  }
}
