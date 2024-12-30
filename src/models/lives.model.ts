import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { previewPhotoSchema, previewVideoSchema } from './commonSchema'
import { OperationalError } from '../utils/OperationalError'

const schema = new Schema(
  {
    client_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    payment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    extpayment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    title: {
      type: String,
      required: true,
    },
    sub_title: {
      type: String,
      required: true,
    },
    stream_key: {
      type: String,
    },

    location: {
      type: String,
      required: true,
    },
    cover_photo: {
      type: previewPhotoSchema,
      required: true,
    },
    preview_video: {
      type: previewVideoSchema,
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
    category: {
      type: [String],
      ref: 'category_enums',
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
    type: {
      type: String,
      enum: ['channel', 'event', 'tvshow', 'podcast', 'sport'],
    },
    participants: {
      type: Number,
      default: 0,
    },
    start: {
      type: Date,
    },
    expiry: {
      type: Date,
    },
    views: {
      type: Number,
    },
    active_views: {
      type: Number,
    },
    likes: {
      type: [String],
    },
    sponsored: {
      type: Boolean,
      required: true,
    },
    popular: {
      type: Boolean,
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    feat_expiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

schema.pre('save', function (next) {
  if (this.start && new Date() > this.start) {
    throw new OperationalError('start date of live event can not be backdated', 400)
  }

  if (this.start && this.expiry && this.start >= this.expiry) {
    throw new OperationalError('start date must be lesser than expiry date', 400)
  }

  next()
})

export const LiveModel = model('lives', schema)
export type LiveSchema = InferSchemaType<typeof schema>
export type Live = HydratedDocumentFromSchema<typeof schema>
