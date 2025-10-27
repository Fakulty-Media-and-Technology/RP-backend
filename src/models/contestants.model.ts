import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { PhotoSchema } from './commonSchema'

const contestantSchema = new Schema(
  {
    liveId: {
      type: Schema.Types.ObjectId,
      ref: 'Live',
      required: true,
      index: true,
    },

    names: {
      type: String,
      required: true,
    },

    photo: {
      type: PhotoSchema,
      required: true,
    },

    occupation: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
      required: true,
    },

    votes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

export const ContestantsModel = model('contestants', contestantSchema)
export type ContestantSchema = InferSchemaType<typeof contestantSchema>
export type Contestant = HydratedDocumentFromSchema<typeof contestantSchema>
