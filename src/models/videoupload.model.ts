import { HydratedDocumentFromSchema, Schema, model } from 'mongoose'
import { S3 } from '../services/aws/s3'

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

    sizeInMB: {
      type: Number,
    },

    parentType: {
      type: String,
      enum: ['vod', 'episode', 'live'], // add more as needed
    },

    parentId: Schema.Types.ObjectId,

    isTranscoded: {
      type: Boolean,
      default: false,
    },

    resolutions: {
      type: [resolutionsSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

schema.pre('save', async function (next) {
  if (this.isTranscoded) {
    this.resolutions = (await S3.setResolutionsPairs(this.key)) as any
  }
  next()
})

export const VideoUploadModel = model('video_uploads', schema)
export type VideoUpload = HydratedDocumentFromSchema<typeof schema>
