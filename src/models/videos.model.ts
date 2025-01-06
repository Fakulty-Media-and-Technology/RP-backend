import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { OperationalError } from '../utils/OperationalError'

const videoUploadSchemaRef = {
  type: Schema.Types.ObjectId,
  ref: 'video_uploads',
}

const episodeSchema = new Schema(
  {
    season: Number,
    episode_number: Number,
    episode_title: String,
    episode_description: String,
    video_upload: {
      ...videoUploadSchemaRef,
      required: [true, 'an episode must have a video upload'],
    },
  },
  { _id: false, timestamps: false, versionKey: false },
)

const schema = new Schema(
  {
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'users',
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

    // required when type !== series
    video_upload: videoUploadSchemaRef,

    description: {
      type: String,
      trim: true,
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

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
    ],

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

schema.pre('validate', function (next) {
  if (this.type !== 'series' && this.video_upload == null) {
    throw new OperationalError('video.video_upload is required for videos that are not series', 400)
  }

  this.is_series = this.type === 'series'
  next()
})

export const VideoModel = model('videos', schema)
export type VideoSchema = InferSchemaType<typeof schema>
export type Video = HydratedDocumentFromSchema<typeof schema>
export type EpisodeSchema = InferSchemaType<typeof episodeSchema>

export async function populateTranscodesWithSignedUrl(video: Video) {
  // if (video.is_series) {
  //   for (const episode of video.episodes) {
  //     if (!episode.bucket) continue

  //     episode.transcodes = (await MediaAccess.getTranscodedLocationURLS(
  //       episode.bucket,
  //       episode.transcodes as any,
  //     )) as any
  //   }
  // }

  // if (video.bucket)
  //   video.transcodes = (await MediaAccess.getTranscodedLocationURLS(
  //     video.bucket,
  //     video.transcodes,
  //   )) as any

  return video.toObject()
}
