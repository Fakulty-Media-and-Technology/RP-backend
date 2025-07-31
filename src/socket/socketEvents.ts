import { Server } from 'socket.io'

import { CommentModel } from '../models/comments.model'
import { LiveModel } from '../models/lives.model'
import { liveStreamAuth } from '../middlewares/ls-auth.mw'
import { OperationalError } from '../utils/OperationalError'

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

export const socketChat = async (io: Server) => {
  console.log('Sockets initited successfully')

  io.on('connection', async socket => {
    socket.on('joinLivestream', async (data, cb: unknown) => {
      try {
        const { token, liveId } = data
        const user = await liveStreamAuth(token)

        const live = await LiveModel.findOneAndUpdate(
          {
            _id: liveId,
            active: true,
          },
          {
            $inc: {
              active_views: 1,
            },

            $addToSet: { views: user },
          },
        )

        if (live == null) {
          throw new OperationalError('invalid live Id', 404)
        }

        socket.join(liveId)

        io.to(liveId).emit('joinedRoom', {
          user_id: user.id,
          message: 'new user joined',
        })

        socket.on('disconnect', async () => {
          try {
            await LiveModel.findByIdAndUpdate(liveId, {
              $inc: {
                active_views: -1,
              },
            })

            io.to(liveId).emit('leftRoom', {
              user_id: user.id,
              message: 'user left',
            })
          } catch (e) {
            console.error('Disconnection error for user: ', user.id, e)
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
        const user = await liveStreamAuth(token)

        if (message.toString().length < 1) {
          throw new OperationalError('A comment must have at least one character', 400)
        }

        const liveEvent = await LiveModel.findOne({
          _id: liveId,
          active: true,
        })

        if (!liveEvent) {
          throw new OperationalError('invalid live Id', 404)
        }

        socket.join(liveId)

        const newComment = await CommentModel.create({
          userId: user._id,
          message: message,
          parentType: 'live',
          parentId: liveId,
        })

        io.to(liveId).emit('livestreamComment', {
          message: newComment,
          room: liveId,
        })
        throw new CompleteError()
      } catch (e) {
        useCbIfExist(e, cb)
      }
    })
  })
}
