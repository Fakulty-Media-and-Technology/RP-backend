import { HydratedDocumentFromSchema, Schema, model } from 'mongoose'
import { viewContents } from './assets'

const schema = new Schema({
  viewer: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },

  content: {
    type: Schema.Types.ObjectId,
    required: true,
  },

  contentType: {
    type: String,
    enum: viewContents,
    required: true,
  },
})

// schema.index({ viewer: 1, content: 1 }, { unique: true })

// on the off chance that two contents from have the same ID
schema.index({ viewer: 1, content: 1, contentType: 1 }, { unique: true })

export const ViewModel = model('views', schema)
export type ViewDocument = HydratedDocumentFromSchema<typeof schema>
