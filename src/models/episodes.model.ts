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
      default: null,
    },

    videoLink: {
      type: String,
      default: null,
    },

    trailerUpload: {
      type: Schema.Types.ObjectId,
      ref: 'trailer',
      default: null,
    },

    videoUpload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
      default: null,
    },

    subtitleUpload: {
      type: Schema.Types.ObjectId,
      ref: 'sub_titles',
      default: null,
    },
  },
  { timestamps: true },
)

schema.index({ season: 1, episode_title: 1 }, { unique: true })
schema.index({ season: 1, episode_number: 1 }, { unique: true })

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
