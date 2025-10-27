import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'
import { PhotoSchema } from './commonSchema'

export const videoTypes = ['movie', 'series', 'music-video', 'skit'] as const

const schema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'A video must have a title'],
    },

    type: {
      type: String,
      enum: videoTypes,
      required: true,
    },

    landscapePhoto: {
      type: PhotoSchema,
      required: true,
    },

    portraitPhoto: {
      type: PhotoSchema,
      required: true,
    },

    videoUpload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
      sparse: true,
      default: null,
    },

    trailerUpload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
      sparse: true,
      default: null,
    },

    description: {
      type: String,
      trim: true,
    },

    primaryColor: {
      type: String,
      required: true,
    },

    vidClass: {
      type: String,
      enum: ['free', 'ad', 'exclusive', 'premium'],
      required: true,
    },

    pg: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
    },

    currency: {
      type: String,
      enum: validCurrencies,
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

    releaseDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
      default: Date.now,
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

    defaultRating: {
      type: Number,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    upcoming: {
      type: Boolean,
      default: false,
    },

    upcomingSubscribers: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'users',
        },
      ],
      default: [],
    },

    featExpiry: {
      type: Date,
    },

    videoLink: {
      type: String,
      default: null,
    },

    trailerLink: {
      type: String,
      default: null,
    },

    artistName: {
      type: String,
    },

    active: {
      type: Boolean,
      default: true,
    },

    showViews: {
      type: Boolean,
      default: true,
    },

    commentsCount: {
      type: Number,
      defut: 0,
    },
  },
  {
    timestamps: true,
  },
)

schema.index({ expiryDate: 1, upcoming: 1 }, { name: '_upcoming' })
schema.index({ type: 1, title: 1, artistName: 1 }, { unique: true, name: '_uniqueTitle' })

export const VideoModel = model('videos', schema)
export type VideoSchema = InferSchemaType<typeof schema>
export type Video = HydratedDocumentFromSchema<typeof schema>

// schema.pre('save', function (next) {
//   if (this.videoLink && this.videoUpload) {
//     throw new OperationalError('only a videoLink OR a videoUpload can be povided', 400)
//   }

//   if (this.trailerLink && this.trailerUpload) {
//     throw new OperationalError('only a trailerLink OR a trailerUpload can be povided', 400)
//   }

//   next()
// })
