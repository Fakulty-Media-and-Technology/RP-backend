import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'

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

    paymentExtentions: [{ type: Schema.Types.ObjectId, ref: 'payments' }],
    donationPayments: [{ type: Schema.Types.ObjectId, ref: 'payments' }],

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

    channelLogo: {
      type: Schema.Types.ObjectId,
      ref: 'poster_images',
      default: null,
    },

    coverPhoto: {
      type: Schema.Types.ObjectId,
      ref: 'poster_images',
      required: true,
    },

    previewVideoUpload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
      default: null,
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

    expiry: {
      type: Date,
      required: true,
    },

    views: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
    ],

    active_views: {
      type: Number,
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

    upcomingSubscribers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    feat_expiry: {
      type: Date,
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

schema.index({ paymentExtentions: 1 })
schema.index({ donationPayments: 1 })
schema.index({ category: 1 })
schema.index({ views: 1 })

export const LiveModel = model('lives', schema)
export type LiveSchema = InferSchemaType<typeof schema>
export type Live = HydratedDocumentFromSchema<typeof schema>
