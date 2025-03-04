import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema({
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },

  video: {
    type: Schema.Types.ObjectId,
    ref: 'videos',
    required: true,
  },

  serial_number: {
    type: Number,
    required: true,
  },

  description: {
    type: String,
    default: null,
  },

})

schema.index({ video: 1, serial_number: 1 }, { unique: true })

export const SeasonModel = model('seasons', schema)
export type SeasonSchema = InferSchemaType<typeof schema>
export type Season = HydratedDocumentFromSchema<typeof schema>
