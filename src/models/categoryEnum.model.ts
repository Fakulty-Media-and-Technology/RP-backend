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

export const CategoryEnumModel = model('category_enums', schema)
export type CategoryEnumSchema = InferSchemaType<typeof schema>
export type CategoryEnum = HydratedDocumentFromSchema<typeof schema>
