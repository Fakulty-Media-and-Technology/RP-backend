import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema(
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

schema.index({ title: 1, name: 1 }, { unique: true })

export const CastEnumModel = model('cast_enums', schema)
export type CastEnumSchema = InferSchemaType<typeof schema>
export type CastEnum = HydratedDocumentFromSchema<typeof schema>
