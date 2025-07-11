import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema(
  {
    position: {
      type: Number,
      required: [true, 'A genre must have a number'],
      unique: true,
    },

    name: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

schema.index({ position: 1, name: -1 }, { unique: true })

export const GenreEnumModel = model('genre_enums', schema)
export type GenreEnumSchema = InferSchemaType<typeof schema>
export type GenreEnum = HydratedDocumentFromSchema<typeof schema>
