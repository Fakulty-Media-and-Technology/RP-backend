import { ClientSession, HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'
import { PhotoSchema } from './commonSchema'

const schema = new Schema(
  {
    client_id: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    payment_id: {
      type: Schema.Types.ObjectId,
      ref: 'payments',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    subTitle: {
      type: String,
    },

    stream_key: {
      type: String,
      required: true,
      unique: true,
    },

    location: {
      type: String,
      required: true,
    },

    coverPhoto: {
      type: PhotoSchema,
      required: true,
    },

    previewVideoUpload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
      default: null,
    },

    isPreviewVideoReady: {
      default: false,
      type: Boolean,
    },

    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'category_enums',
      },
    ],

    vid_class: {
      type: String,
      enum: ['free', 'ad', 'exclusive'],
      required: true,
    },

    pg: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    active: {
      type: Boolean,
      default: false,
    },

    expired: {
      type: Boolean,
      default: false,
    },

    amount: {
      type: Number,
    },

    currency: {
      type: String,
      enum: validCurrencies,
    },

    type: {
      type: String,
      enum: ['channel', 'event', 'tvshow', 'podcast', 'sport'],
      required: true,
    },

    start: {
      type: Date,
      required: true,
    },

    reminder24hSentAt: {
      type: Date,
      default: null,
      index: true,
    },

    reminder1hSentAt: {
      type: Date,
      default: null,
      index: true,
    },

    reminder10mSentAt: {
      type: Date,
      default: null,
      index: true,
    },

    reminder24hAttemptCount: {
      type: Number,
      default: 0,
    },

    reminder10MinutesAttemptCount: {
      type: Number,
      default: 0,
    },

    reminder1hAttemptCount: {
      type: Number,
      default: 0,
    },

    reminder24hLastError: {
      type: String,
      default: null,
    },

    reminder10MinutesError: {
      type: String,
      default: null,
    },

    reminder1hLastError: {
      type: String,
      default: null,
    },

    expiry: {
      type: Date,
      required: true,
    },

    active_views: {
      type: Number,
      default: 0,
    },

    sponsored: {
      type: Boolean,
      default: false,
    },

    popular: {
      type: Boolean,
      default: false,
    },

    upcoming: {
      type: Boolean,
      default: false,
    },

    category: [
      {
        type: Schema.Types.ObjectId,
        ref: 'category_enums',
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    feat_expiry: {
      type: Date,
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    viewsCount: {
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

    methods: {
      async computeEngagements(session?: ClientSession) {
        try {
          this.engagements =
            this.likesCount + this.commentsCount + this.viewsCount + this.active_views
          await this.save({ session })
        } catch (e) {
          console.error('Error in LiveDocument.computeEngagements', e)
        }
      },
    },
  },
)

schema.index({ engagements: -1 })
schema.index({ expiry: -1 })
schema.index({ category: 1 })
schema.index({ views: 1 })

schema.index({
  start: 1,
  reminder24hSentAt: 1,
  reminder1hSentAt: 1,
  reminder10mSentAt: 1
})

export const LiveModel = model('lives', schema)
export type LiveSchema = InferSchemaType<typeof schema>
export type Live = HydratedDocumentFromSchema<typeof schema>
