import { query } from 'express'
import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { OperationalError } from '../utils/OperationalError'

const schema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    season: {
      type: Schema.Types.ObjectId,
      ref: 'seasons',
      required: true,
    },

    episode_number: {
      type: Number,
      required: true,
    },

    episode_title: {
      type: String,
      required: true,
    },

    trailerLink: String,

    trailerUpload: {
      type: Schema.Types.ObjectId,
      ref: 'trailer',
    },

    episode_description: String,

    // can add more stuff here as needed

    video_upload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
    },

    video_link: String,
  },
  { timestamps: true },
)

schema.index({ season: 1, episode_title: 1 }, { unique: true })
schema.index({ season: 1, episode_number: 1 }, { unique: true })

schema.pre('validate', function (next) {
  if (!!this.trailerLink === !!this.trailerUpload) {
    throw new OperationalError('provide either trailer link or trailer upload Id', 400)
  }

  if (!!this.video_link === !!this.video_upload) {
    throw new OperationalError('provide either a video_link or a video_uoload', 400)
  }
  next()
})

schema.pre('find', function (next) {
  this.populate('video_upload')
  next()
})

schema.pre('findOne', function (next) {
  this.populate('video_upload')
  next()
})

export const EpisodeModel = model('episodes', schema)
export type EpisodeSchema = InferSchemaType<typeof schema>
export type Episode = HydratedDocumentFromSchema<typeof schema>

const x = {} as Episode
