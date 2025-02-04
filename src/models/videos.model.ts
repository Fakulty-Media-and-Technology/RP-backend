import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema(
  {
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'A video must have a title'],
      unique: true,
    },

    type: {
      type: String,
      enum: ['movie', 'series', 'music video', 'skit'],
      required: true,
    },

    video_upload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
    },

    trailer_upload: {
      type: Schema.Types.ObjectId,
      ref: 'trailers',
    },

    subtitle_upload: {
      type: Schema.Types.ObjectId,
      ref: 'sub_titles',
    },

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

    videoLink: String,
    trailerLink: String,

    artist_name: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

export const VideoModel = model('videos', schema)
export type VideoSchema = InferSchemaType<typeof schema>
export type Video = HydratedDocumentFromSchema<typeof schema>
