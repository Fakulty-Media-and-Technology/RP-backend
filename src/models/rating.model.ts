import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const ratingSchema = new Schema(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
