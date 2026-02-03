import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'
import { PhotoSchema } from './commonSchema'
import { addYears, addYearsClone } from '../utils/date'
import { MaybeSession } from '../utils/mongoDbSessionRunner'

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
      sparse: true,
    },

    expiryDate: Date,

    isVideoReady: {
      type: Boolean,
      default: false,
    },

    isTrailerReady: {
      type: Boolean,
      defualt: false,
    },

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

    // TODO: Offload to a different collection
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

    videoLink: String,
    trailerLink: String,
    artistName: String,

    active: {
      type: Boolean,
      default: true,
    },

    showViews: {
      type: Boolean,
      default: true,
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    viewsCount: {
      type: Number,
      default: 0,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    averageRating: {
      type: Number,
      default: 0,
    },

    engagements: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

schema.pre('save', function (next) {
  if (this.isNew == false) return next()

  this.isVideoReady = typeof this.videoLink === 'string' || false
  this.isTrailerReady = typeof this.trailerLink === 'string' || false

  if (this.expiryDate == null && this.releaseDate) {
    this.expiryDate = addYearsClone(this.releaseDate, 1)
  }

  next()
})

schema.index({ engagements: -1 })
schema.index({ isVideoReady: 1, isTrailerReady: 1 }, { name: '_videosReady' })
schema.index({ expiryDate: 1, upcoming: 1 }, { name: '_upcoming' })
schema.index({ type: 1, title: 1 }, { unique: true, name: '_uniqueTitlePerType' })

export const VideoModel = model('videos', schema)
export type VideoSchema = InferSchemaType<typeof schema>
export type Video = HydratedDocumentFromSchema<typeof schema>
