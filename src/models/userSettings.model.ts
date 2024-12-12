import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const settingsSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    interest: {
      type: [String],
      lowercase: true,
    },
    watchlist: {
      type: [String],
      lowercase: true,
    },
    video_quality: {
      type: String,
      lowercase: true,
      enum: ['480p', '720p', '1080p'],
    },
    //Notification Settings
    allow_notifications: {
      type: Boolean,
      default: true,
    },
    new_services: {
      type: Boolean,
      default: false,
    },
    upcoming_events: {
      type: Boolean,
      default: false,
    },
    new_arrivals: {
      type: Boolean,
      default: false,
    },
    live_channels: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

export const SettingModel = model('Setting', settingsSchema)
export type SettingSchema = InferSchemaType<typeof settingsSchema>
export type Setting = HydratedDocumentFromSchema<typeof settingsSchema>
