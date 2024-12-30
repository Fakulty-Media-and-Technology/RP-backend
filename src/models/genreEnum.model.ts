import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema(
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

export const GenreEnumModel = model('genre_enums', schema)
export type GenreEnumSchema = InferSchemaType<typeof schema>
export type GenreEnum = HydratedDocumentFromSchema<typeof schema>
