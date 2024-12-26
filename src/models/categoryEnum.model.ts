import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const categoryEnumSchema = new Schema(
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

export const CategoryEnumModel = model('category_enums', categoryEnumSchema)
export type CategoryEnumSchema = InferSchemaType<typeof categoryEnumSchema>
export type CategoryEnum = HydratedDocumentFromSchema<typeof categoryEnumSchema>
