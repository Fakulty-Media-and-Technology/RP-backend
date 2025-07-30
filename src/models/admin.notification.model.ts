import { InferSchemaType, Schema, model } from 'mongoose'
import { previewPhotoSchema } from './commonSchema'

const schema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    photo: previewPhotoSchema,
  },
  { timestamps: true, versionKey: false },
)

export const AdminNotificationModel = model('admin-notifications', schema)
export type AdminNotificationSchema = InferSchemaType<typeof schema>
