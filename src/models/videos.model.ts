import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { S3 } from '../services/aws/s3'
import { MediaAccess } from '../services/media-access'

const transcodeResolutionsEnums = ['1080', '720', '480'] as const

const isTranscodedKey = (key: string) => key.startsWith('transcode')

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

const episodeSchema = new Schema(
  {
    season: Number,
    episode_number: Number,
    episode_title: String,
    episode_description: String,
    bucket: String,
    key: String,
    transcodes: [transcodeSchema],
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

    // seasons: {
    //      type: Number,
    // },
    episodes: [episodeSchema],

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
  if (this.isNew) await setTranscodes(this, false)
  next()
})

export const VideoModel = model('videos', schema)
export type VideoSchema = InferSchemaType<typeof schema>
export type Video = HydratedDocumentFromSchema<typeof schema>

// do not make an arrow function.
export async function setTranscodes(video: Video, save: boolean) {
  if (video.is_series && video.episodes.length) {
    for (const episode of video.episodes) {
      if (!episode.key || !isTranscodedKey(episode.key)) continue
      episode.transcodes = (await S3.getResolutionAndSignedUrls(episode.key)) as any
    }
  } else if (video.key && isTranscodedKey(video.key)) {
    video.transcodes = (await S3.getResolutionAndSignedUrls(video.key)) as any
  }

  if (save) {
    await video.save()
  }
}

export async function populateTranscodesWithSignedUrl(video: Video) {
  if (video.is_series) {
    for (const episode of video.episodes) {
      if (!episode.bucket) continue

      episode.transcodes = (await MediaAccess.getTranscodedSignedUrls(
        episode.bucket,
        episode.transcodes as any,
      )) as any
    }
  }

  if (video.bucket)
    video.transcodes = (await MediaAccess.getTranscodedSignedUrls(
      video.bucket,
      video.transcodes,
    )) as any

  return video.toObject()
}
