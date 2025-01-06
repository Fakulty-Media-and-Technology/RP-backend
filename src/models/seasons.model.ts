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

  episodes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'episodes',
    },
  ],

  serial_number: {
    type: Number,
    required: true,
  },

  // add other fields here as needed
})

schema.pre('find', function (next) {
  this.populate('episodes')
  next()
})

schema.pre('findOne', function (next) {
  this.populate('episodes')
  next()
})

schema.index({ video: 1, serial_number: 1 }, { unique: true })

export const SeasonModel = model('seasons', schema)
export type SeasonSchema = InferSchemaType<typeof schema>
export type Season = HydratedDocumentFromSchema<typeof schema>
