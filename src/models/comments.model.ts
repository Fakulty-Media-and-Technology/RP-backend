import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { assets } from './assets'

const commentSchema = new Schema(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    message: {
      type: String,
    },

    type: {
      type: String,
      enum: assets,
    },
    
    parentId: Schema.Types.ObjectId
  },
  {
    timestamps: true,
  },
)

export const CommentModel = model('comments', commentSchema)
export type CommentSchema = InferSchemaType<typeof commentSchema>
export type Comment = HydratedDocumentFromSchema<typeof commentSchema>
