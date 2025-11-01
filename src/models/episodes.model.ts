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

    episodeNumber: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: String,

    trailerLink: {
      type: String,
    },

    videoLink: {
      type: String,
    },

    trailerUpload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
    },

    videoUpload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
    },

    isVideoReady: {
      type: Boolean,
      default: false,
    },

    isTrailerReady: {
      type: Boolean,
      default: false,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    viewsCount: {
      type: Number,
      default: 0,
    },

    averageRating: {
      type: Number,
      default: 4.5,
    },
  },
  { timestamps: true, versionKey: false },
)

schema.pre('save', function (next) {
  if (this.isNew) {
    this.isVideoReady = typeof this.videoLink === 'string'
    this.isTrailerReady = typeof this.trailerLink === 'string'
  }
  next()
})

schema.index({ isVideoReady: 1, isTrailerReady: 1 })
schema.index({ season: 1, title: 1 }, { unique: true })
schema.index({ season: 1, episodeNumber: 1 }, { unique: true })

schema.pre('validate', function (next) {
  if (!!this.trailerLink === !!this.trailerUpload) {
    throw new OperationalError('provide either trailerLink or trailerUpload', 400)
  }

  if (!!this.videoLink === !!this.videoUpload) {
    throw new OperationalError('provide either a videoLink or a videoUpload', 400)
  }
  next()
})

export const EpisodeModel = model('episodes', schema)
export type EpisodeSchema = InferSchemaType<typeof schema>
export type Episode = HydratedDocumentFromSchema<typeof schema>
