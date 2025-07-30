import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    adminNotification: {
      type: Schema.Types.ObjectId,
      ref: 'admin-notifications',
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },

    hasRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
)

export const CustomerNotificationModel = model('customer-notifications', schema)
