import { Server } from 'socket.io'

import { CommentModel } from '../models/comments.model'
import { LiveModel } from '../models/lives.model'
import { liveStreamAuth } from '../middlewares/ls-auth.mw'

const getUserFromAuth = async (token: string) => {
  try {
    return await liveStreamAuth(token)
  } catch (e: any) {
    return null
  }
}

export const socketChat = async (io: Server) => {
  console.log('Sockets initited successfully')

  io.on('connection', async socket => {
    // let rooms = [...socket.rooms]

    socket.on('joinLivestream', async data => {
      const { token, liveId } = data

      const user = await getUserFromAuth(token)

      if (user == null) return

      const liveEvent = await LiveModel.findOne({
        _id: liveId,
        active: true,
      })

      if (!liveEvent) return null

      // if (!rooms.includes(liveId)) {
      //   socket.join(live_id)
      // }

      socket.join(liveId)

      await LiveModel.findByIdAndUpdate(liveId, {
        $inc: {
          active_views: 1,
        },

        $addToSet: { views: user },
      })

      io.to(liveId).emit('joinedRoom', {
        user_id: user.id,
        message: 'new user joined',
      })

      socket.on('disconnect', async () => {
        await LiveModel.findByIdAndUpdate(liveId, {
          $inc: {
            active_views: -1,
          },
        })

        io.to(liveId).emit('leftRoom', {
          user_id: user.id,
          message: 'user left',
        })
      })
    })

    socket.on('livestreamComment', async data => {
      const { token, liveId, message } = data

      const user = await getUserFromAuth(token)

      if (user == null) return

      const liveEvent = await LiveModel.findOne({
        _id: liveId,
        active: true,
      })

      if (!liveEvent || message.toString().length < 2) return null

      socket.join(liveId)

      const newComment = await CommentModel.create({
        userId: user._id,
        message: message,
        parentType: 'live',
        parentId: liveId
      })

      io.to(liveId).emit('livestreamComment', {
        message: newComment,
        room: liveId,
      })
    })
  })
}
