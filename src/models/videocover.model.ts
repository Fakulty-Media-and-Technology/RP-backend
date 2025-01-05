import { HydratedDocumentFromSchema, Schema, model } from 'mongoose'
import { MediaAccess } from '../services/media-access'
import { setResolutionUrls } from '../utils'

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
    methods: {
      async getSignedLocationURLS() {
        if (this.isTranscoded) {
          const resUrls = await MediaAccess.getTranscodedLocationURLS(
            this.bucket,
            this.resolutionUrls,
          )

          this.resolutionUrls = resUrls as any
        } else {
          this.resolutionUrls = [
            {
              resolution: 'raw',
              key: await MediaAccess.getSignedUrl(this.bucket, this.key, 'video'),
            },
          ] as any
        }

        return this.toObject()
      },
    },
  },
)

schema.pre('save', async function (next) {
  if (this.isNew) await setResolutionUrls(this)
  next()
})

export const VideoCoverModel = model('VideoCover', schema)
export type VideoCover = HydratedDocumentFromSchema<typeof schema>
