import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const featuredSchema = new Schema(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    expiry: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
)

export const FeaturedModel = model('Featured', featuredSchema)
export type FeaturedSchema = InferSchemaType<typeof featuredSchema>
export type Featured = HydratedDocumentFromSchema<typeof featuredSchema>
