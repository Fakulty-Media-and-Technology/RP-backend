import { Schema, model, HydratedDocumentFromSchema, InferSchemaType } from 'mongoose'

const admanagerSchema = new Schema(
  {
    title: {
      type: String,
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
    },
    photo: {
      type: Object,
    },
    link: {
      type: String,
    },
    duration: {
      type: String,
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

export const AdmanagerModel = model('Admanager', admanagerSchema)
export type AdmanagerSchama = InferSchemaType<typeof admanagerSchema>
export type Admanager = HydratedDocumentFromSchema<typeof admanagerSchema>
