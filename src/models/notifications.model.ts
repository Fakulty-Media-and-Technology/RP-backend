import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const notificationSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    value_id: {
      type: String,
    },
    type: {
      type: String,
      enum: ['NEW_ARRIVAL', 'SYSTEM'],
      default: 'NEW_ARRIVAL',
    },
    content_id: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    photo: {
      Bucket: String,
      Key: String,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    categories: [String],
  },
  {
    timestamps: true,
  },
)

export const NotificationModel = model('Notification', notificationSchema)
export type NotificationSchema = InferSchemaType<typeof notificationSchema>
export type Notification = HydratedDocumentFromSchema<typeof notificationSchema>
