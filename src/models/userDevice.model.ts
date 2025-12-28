import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const userdeviceSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    device_id: {
      type: String,
      required: true,
    },
    device_token: {
      type: String,
      required: true,
      index: true,
    },
    device_type: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const UserDeviceModel = model('userdevices', userdeviceSchema)
export type UserDeviceSchema = InferSchemaType<typeof userdeviceSchema>
export type UserDevice = HydratedDocumentFromSchema<typeof userdeviceSchema>
