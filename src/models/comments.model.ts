import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const commentSchema = new Schema(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
    },
    type: {
      type: String,
      enum: ['live', 'vod'],
    },
  },
  {
    timestamps: true,
  },
)

export const CommentModel = model('Comment', commentSchema)
export type CommentSchema = InferSchemaType<typeof commentSchema>
export type Comment = HydratedDocumentFromSchema<typeof commentSchema>
