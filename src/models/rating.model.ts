import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { ratingsParent } from './assets'

const ratingSchema = new Schema(
  {
    parentType: {
      type: String,
      enum: ratingsParent,
      required: true,
    },

    parentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    rate: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

ratingSchema.index({ userId: 1, parentId: 1 }, { unique: true })

export const RatingModel = model('ratings', ratingSchema)
export type RatingSchema = InferSchemaType<typeof ratingSchema>
export type Rating = HydratedDocumentFromSchema<typeof ratingSchema>
