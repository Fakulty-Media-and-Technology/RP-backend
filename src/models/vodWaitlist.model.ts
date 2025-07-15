import { Schema, model } from 'mongoose'

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    unique: true,
  },

  vods: {
    type: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  },
})

export const VodWaitlistModel = model('vod_waitlists', schema)
