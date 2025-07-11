import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { commentsParent } from './assets'

const commentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    message: {
      type: String,
    },

    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'comments',
      sparse: true,
    },
    
    parentReplyId: {
      type: Schema.Types.ObjectId,
      ref: 'comments',
      sparse: true,
    },

    parentType: {
      type: String,
      enum: commentsParent,
      required: [true, 'A comment must have a type'],
    },

    parentId: {
      type: Schema.Types.ObjectId,
      required: [true, 'A comment must have a parent Id'],
    },
  },
  {
    timestamps: true,
  },
)

export const CommentModel = model('comments', commentSchema)
export type CommentSchema = InferSchemaType<typeof commentSchema>
export type Comment = HydratedDocumentFromSchema<typeof commentSchema>
