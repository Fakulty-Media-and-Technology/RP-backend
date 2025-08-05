import { Server } from 'socket.io'
import mongoose from 'mongoose'
import { createServer } from 'node:http'

import env from './env'
import { reeplayApp } from './app'
import { Assets } from './utils/Assets'
import { MediaStream } from './livestream/nms'
import { FileHandler } from './utils/FileHandler'
import { connectMongoDB } from './utils/connectDB'
import { socketChat } from './socket/socketEvents'
import { purgeOldTempMediaFiles } from './utils/purgeOldTempMediaFiles'
import { WithWorkerThread } from './utils/WithWorkerThread'

const { PORT } = env

const app = reeplayApp()
const httpServer = createServer(app)
const mediaStream = new MediaStream()
const io = new Server(httpServer, {
  cors: { origin: '*' },
})

const makeMediaDirectories = () => {
  Object.values(Assets.rootMediaDirs).forEach(dir => FileHandler.createDirIfNotExistSync(dir))
}

makeMediaDirectories()

connectMongoDB().then(conn => {
  console.log(conn)

  httpServer.listen(PORT, async () => {
    console.log(`Node Server Listening on port: ${PORT} >>>>>> [http://localhost:${PORT}]`)

    socketChat(io)
    console.log('Sockets initited successfully')
    WithWorkerThread.manageJobs('START')
    console.log('Cron Workers initited successfully')
    mediaStream.initiate()
    console.log('RTMP-HLS PIPE initited successfully')
    setInterval(() => purgeOldTempMediaFiles(), 600000) // every ten minutes
  })
})


httpServer.on('close', async () => {
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

    args.forEach(arg => console.error(arg.message ?? arg))

    console.error('Reasons >>>> 🛑:', args.join(' | '))

    // *********** clean up
    io.close()
    console.log('IO Websocket closed')

    await WithWorkerThread.manageJobs('STOP')
    mediaStream.close()
    await mongoose.connection.close(true)
    console.log('Mongoose connection closed')
    httpServer.close()
  }
}
