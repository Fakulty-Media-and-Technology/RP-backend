import { Schema } from 'mongoose'

export const PhotoSchema = new Schema(
  {
    Bucket: {
      type: String,
      required: true,
    },
    Key: {
      type: String,
      required: true,
    },
  },
  { timestamps: false, _id: false, versionKey: false },
)
