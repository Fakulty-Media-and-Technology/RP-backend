import { Schema, model, HydratedDocumentFromSchema, InferSchemaType } from 'mongoose'
import { previewPhotoSchema, previewVideoSchema } from './commonSchema'

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ['general', 'movie_ad', 'web', 'mobile'],
      default: 'mobile',
      index: true,
    },

    brand: {
      type: String,
      required: true,
      index: true,
    },

    photo: {
      type: previewPhotoSchema,
      required: true,
    },

    videoUpload: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    link: {
      type: String,
      required: true,
    },

    cta: {
      type: String,
      required: true,
    },

    duration: {
      type: Number, // in days
    },

    start: {
      type: Date,
      required: true,
    },

    expiry: {
      type: Date,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

schema.index({ title: 1, brand: 1 }, { unique: true })

export const AdModel = model('ads', schema)
export type AdSchema = InferSchemaType<typeof schema>
export type AdDocument = HydratedDocumentFromSchema<typeof schema>
