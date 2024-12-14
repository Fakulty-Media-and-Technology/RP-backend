import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const genreEnumSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const GenreEnumModel = model('genre_enums', genreEnumSchema)
export type GenreEnumSchema = InferSchemaType<typeof genreEnumSchema>
export type GenreEnum = HydratedDocumentFromSchema<typeof genreEnumSchema>
