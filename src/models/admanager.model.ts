import { Schema, model, HydratedDocumentFromSchema, InferSchemaType } from 'mongoose'
import { previewPhotoSchema } from './commonSchema'
import { OperationalError } from '../utils/OperationalError'

const schema = new Schema(
  {
    title: {
      type: String,
      unique: true,
      required: true,
    },

    sub_title: {
      type: String,
    },

    type: {
      type: String,
      enum: ['general', 'movie_ad', 'web', 'mobile'],
    },
    brand: {
      type: String,
      required: true,
    },
    photo: previewPhotoSchema,

    link: {
      type: String,
    },
    duration: {
      type: Number, // in days
    },
    start: {
      type: Date,
    },
    expiry: {
      type: Date,
    },
    active: {
      type: Boolean,
      //    default: true
    },
  },
  {
    timestamps: true,
  },
)

schema.index({ title: 1, brand: 1 }, { unique: true })

schema.pre('save', function (next) {
  if (!this.start && !this.expiry && !this.duration) {
    throw new OperationalError('an add must have a duration or a start and an expiry', 400)
  }

  if (this.start && !this.expiry && !this.duration) {
    throw new OperationalError('expiry or duration must be provided', 400)
  }

  if (this.duration) {
    this.start = this.start != null ? this.start : new Date() // default to now
    const clone = structuredClone(this.start)
    clone.setDate(clone.getDate() + this.duration)
    this.expiry = new Date(clone) // overwrite expiry if present
  }

  if (this.start && this.expiry && this.start >= this.expiry) {
    throw new OperationalError('start can not be greater than or equal expiry', 400)
  }

  if (this.start && this.start < new Date()) {
    throw new OperationalError('start can not be backdated', 400)
  }

  next()
})

export const AdmanagerModel = model('admanagers', schema)
export type AdmanagerSchema = InferSchemaType<typeof schema>
export type Admanager = HydratedDocumentFromSchema<typeof schema>
