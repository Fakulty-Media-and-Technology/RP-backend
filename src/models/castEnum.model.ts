import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },

    link: {
      type: String,
      trim: true,
    },

    selectButtonType: {
      type: String,
      enum: ['book-now', 'fan-page'],
      sparse: true,
    },

    name: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      lowercase: true,
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
  },
  {
    timestamps: true,
  },
)

schema.index({ title: 1, name: 1 }, { unique: true })

export const CastEnumModel = model('cast_enums', schema)
export type CastEnumSchema = InferSchemaType<typeof schema>
export type CastEnumDocument = HydratedDocumentFromSchema<typeof schema>
