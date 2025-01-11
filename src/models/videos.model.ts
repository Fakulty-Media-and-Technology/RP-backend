import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { OperationalError } from '../utils/OperationalError'

const schema = new Schema(
  {
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    title: {
      type: String,
      required: true,
      unique: true,
    },

    sub_title: {
      type: String,
    },

    type: {
      type: String,
      enum: ['movie', 'series', 'music video', 'skit'],
      required: true,
    },

    video_link: String,

    video_upload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
    },

    description: {
      type: String,
      trim: true,
    },

    vid_class: {
      type: String,
      enum: ['free', 'ad', 'exclusive', 'premium'],
      required: true,
    },

    pg: {
      type: String,
      required: true,
    },

    genre: [
      {
        type: Schema.Types.ObjectId,
        ref: 'genre_enums',
      },
    ],

    category: [
      {
        type: Schema.Types.ObjectId,
        ref: 'category_enums',
      },
    ],

    cast: [
      {
        type: Schema.Types.ObjectId,
        ref: 'cast_enums',
      },
    ],

    released_date: {
      type: Date,
    },

    expiry_date: {
      type: Date,
    },

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
    ],

    runtime: {
      type: String,
    },

    default_rating: {
      type: Number,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    feat_expiry: {
      type: Date,
    },

    is_series: {
      type: Boolean,
      required: true,
    },

    trailerLink: String,

    trailerUpload: {
      type: Schema.Types.ObjectId,
      ref: 'trailers',
    },

    seasons: [
      {
        type: Schema.Types.ObjectId,
        ref: 'seasons',
      },
    ],

    artist_name: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

schema.pre('validate', function (next) {
  this.is_series = this.type === 'series'
  next()
})

schema.pre('validate', function (next) {
  if (!this.is_series && !!this.trailerLink === !!this.trailerUpload) {
    throw new OperationalError('provide either trailer link or trailer upload', 400)
  }

  if (!this.is_series && !!this.video_link === !!this.video_upload) {
    throw new OperationalError('provide either a video_link or a video_uoload', 400)
  }
  next()
})

export const VideoModel = model('videos', schema)
export type VideoSchema = InferSchemaType<typeof schema>
export type Video = HydratedDocumentFromSchema<typeof schema>
