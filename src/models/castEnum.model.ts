import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const castEnumSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
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

export const CastEnumModel = model('cast_enums', castEnumSchema)
export type CastEnumSchema = InferSchemaType<typeof castEnumSchema>
export type CastEnum = HydratedDocumentFromSchema<typeof castEnumSchema>
