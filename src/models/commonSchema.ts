import { Schema } from 'mongoose'

export const previewPhotoSchema = new Schema(
  {
    Bucket: { type: String, required: true },
    Key: { type: String, required: true },
    ContentType: { type: String },
  },
  { timestamps: false, _id: false, versionKey: false },
)

export const previewVideoSchema = new Schema(
  {
    Bucket: { type: String, required: true },
    Key: { type: String, required: true },
    ContentType: { type: String },
  },
  { timestamps: false, _id: false, versionKey: false },
)
