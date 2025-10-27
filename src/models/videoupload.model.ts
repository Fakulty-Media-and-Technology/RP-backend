import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { S3 } from '../services/aws/s3'
import { videoUploadParents } from './assets'

const resolutionsSchema = new Schema(
  {
    resolution: {
      type: String,
      enum: ['1080', '720', '480'],
      required: true,
    },

    key: {
      type: String,
      required: true,
    },
  },
  { _id: false, timestamps: false, versionKey: false },
)

const schema = new Schema(
  {
    bucket: {
      type: String,
      required: true,
    },

    key: {
      type: String,
      required: true,
      unique: true,
    },

    mimetype: {
      type: String,
    },

    size: {
      type: Number,
    },

    isTranscoded: {
      type: Boolean,
      default: false,
    },

    parentType: {
      type: String,
      enum: videoUploadParents, // add more as needed
    },

    parentId: {
      type: Schema.Types.ObjectId,
      requires: true,
    },

    resolutions: [resolutionsSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

schema.index(
  { isTranscoded: 1 },
  {
    partialFilterExpression: { isTranscoded: false },
    name: '_isTranscodedStatus',
  },
)

export const VideoUploadModel = model('video_uploads', schema)
export type VideoUpload = HydratedDocumentFromSchema<typeof schema>
export type VideoUploadSchema = InferSchemaType<typeof schema>
