import { HydratedDocumentFromSchema, Schema, model } from 'mongoose'
import { MediaAccess } from '../services/media-access'
import { S3 } from '../services/aws/s3'

const transcodeSchema = new Schema(
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
      enum: ['vod', 'episode', 'event'], // add more as needed
    },

    parentId: String,

    isTranscoded: {
      type: Boolean,
      default: false,
    },

    resolutionUrls: {
      type: [transcodeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

schema.pre('save', async function (next) {
  if (this.key.startsWith('transcode')) {
    this.resolutionUrls = (await S3.getTranscodedUrlsWithResolutions(this.key)) as any
    this.isTranscoded = true
  }
  next()
})

export const VideoUploadModel = model('video_uploads', schema)
export type VideoUpload = HydratedDocumentFromSchema<typeof schema>
