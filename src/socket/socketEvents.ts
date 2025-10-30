import { Server } from 'socket.io'

import { CommentModel } from '../models/comments.model'
import { LiveModel } from '../models/lives.model'
import { liveStreamAuth } from '../middlewares/ls-auth.mw'
import { OperationalError } from '../utils/OperationalError'
import { withMongoDBSession } from '../utils/mongoDbSessionRunner'
import { LiveStreamService } from '../services/core/LiveStreamService'

const useCbIfExist = (e: unknown, cb: any) => {
  if (cb && typeof cb === 'function') {
    cb(e)
  }
}

class CompleteError extends OperationalError {
  constructor() {
    super('Complete', 200)
  }
}

// TODO: After sprint.. Make this a class. Much Cleaner
// TODO: Create catchasync middleware to wrap all async event methods

export const socketChat = async (io: Server) => {
  io.on('connection', async socket => {
    socket.on('joinLivestream', async (data, cb: unknown) => {
      try {
        const { token, liveId } = data
        const userDocument = await liveStreamAuth(token)

        await withMongoDBSession(LiveStreamService.handleSocketMembership, {
          userDocument,
          liveId,
          membership: 'JOIN',
        })

        socket.join(liveId)

        io.to(liveId).emit('joinedRoom', {
          user_id: userDocument._id,
          message: 'new user joined',
        })

        socket.on('disconnect', async () => {
          try {
            await withMongoDBSession(LiveStreamService.handleSocketMembership, {
              userDocument,
              liveId,
              membership: 'LEAVE',
            })

            io.to(liveId).emit('leftRoom', {
              user_id: userDocument._id,
              message: 'user left',
            })
          } catch (e) {
            console.error('Disconnection error for user: ', userDocument._id, e)
          }
        })

        throw new CompleteError()
      } catch (e) {
        useCbIfExist(e, cb)
      }
    })

    socket.on('livestreamComment', async (data, cb) => {
      try {
        const { token, liveId, message } = data
        const userDocument = await liveStreamAuth(token)

        const comment = await LiveStreamService.handleSocketComment({
          userDocument,
          liveId,
          message,
        })

        io.to(liveId).emit('livestreamComment', {
          message: comment,
          room: liveId,
        })
        throw new CompleteError()
      } catch (e) {
        useCbIfExist(e, cb)
      }
    })
  })
}
