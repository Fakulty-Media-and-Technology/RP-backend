import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const posterSchema = new Schema(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    bucket: {
      type: String,
      required: true,
    },

    key: {
      type: String,
      required: true,
    },

    dimension: {
      type: String,
      enum: ['landscape', 'portrait', null],
      default: null,
    },

    parentType: {
      type: String,
      enum: ['vod', 'live', 'season', 'episode', 'upcoming'],
      required: [true, 'A poster must have a parent type'],
    },
  },
  {
    timestamps: true,
  },
)

export const PosterImageModel = model('poster_images', posterSchema)
export type PosterImageSchema = InferSchemaType<typeof posterSchema>
export type PosterImage = HydratedDocumentFromSchema<typeof posterSchema>
