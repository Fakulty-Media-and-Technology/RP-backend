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
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    rate: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
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

export const RatingModel = model('ratings', ratingSchema)
export type RatingSchema = InferSchemaType<typeof ratingSchema>
export type Rating = HydratedDocumentFromSchema<typeof ratingSchema>
