import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { S3 } from '../services/aws/s3'

const transcodeResolutionsEnums = ['1080', '720', '480'] as const

const parseToTransodedSchema = async (s3Key: string) => {
  const keys = await S3.getTranscodedKeys(s3Key)

  return keys.map(key => {
    const _data = {
      resolution: '',
      key,
    }

    switch (true) {
      case key.includes('_1080p'):
        _data.resolution = '1080'
        break
      case key.includes('_480p'):
        _data.resolution = '480'
        break
      default:
        _data.resolution = '720'
        break
    }

    return _data
  })
}

const isTranscodedKey = (key: string) => key.startsWith('transcode/')

const transcodeSchema = new Schema(
  {
    resolution: {
      type: String,
      enum: transcodeResolutionsEnums,
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
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    sub_title: {
      type: String,
    },
    type: {
      type: String,
      enum: ['movie', 'series', 'music video', 'skit'],
      required: true,
    },
    bucket: {
      type: String,
      trim: true,
      // required: true,
    },
    key: {
      type: String,
      trim: true,
      // unique: true, // series keys are embedded in episodes. This throws. Switching to manual
      // required: true,
    },

    transcodes: [transcodeSchema],

    description: {
      type: String,
      trim: true,
      // required: true,
    },
    vid_class: {
      type: String,
      enum: ['free', 'ad', 'exclusive', 'premium'],
      required: true,
    },
    pg: {
      type: String,
      required: true,
    },
    genre: [
      {
        type: Schema.Types.ObjectId,
        ref: 'genre_enums',
      },
    ],

    category: [
      {
        type: Schema.Types.ObjectId,
        ref: 'category_enums',
      },
    ],

    cast: [
      {
        type: Schema.Types.ObjectId,
        ref: 'cast_enums',
      },
    ],

    released_date: {
      type: Date,
    },
    expiry_date: {
      type: Date,
    },
    likes: {
      type: [String],
    },
    runtime: {
      type: String,
    },
    default_rating: {
      type: Number,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    feat_expiry: {
      type: Date,
    },
    is_series: {
      type: Boolean,
      required: true,
    },

    is_transcodedKey: {
      type: Boolean,
      default: false,
    },
    // seasons: {
    //      type: Number,
    // },
    episodes: [
      {
        season: Number,
        episode_number: Number,
        episode_title: String,
        episode_description: String,
        bucket: String,
        key: String,
        transcodes: [transcodeSchema],
      },
    ],

    artist_name: {
      //for music video
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

schema.pre('validate', async function (next) {
  if (!this.isNew) return next()

  if (this.key && isTranscodedKey(this.key)) {
    this.transcodes = (await parseToTransodedSchema(this.key)) as any
    this.is_transcodedKey = true
  }

  if (!this.is_series || !this.episodes.length) return next()

  for (const episode of this.episodes) {
    if (episode.key && isTranscodedKey(episode.key)) {
      episode.transcodes = (await parseToTransodedSchema(episode.key)) as any
    }
  }

  this.is_transcodedKey = true
  next()
})

export const VideoModel = model('videos', schema)
export type VideoSchema = InferSchemaType<typeof schema>
export type Video = HydratedDocumentFromSchema<typeof schema>
