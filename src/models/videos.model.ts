import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

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
    episodes: [
      {
        season: Number,
        episode_number: Number,
        episode_title: String,
        episode_description: String,
        bucket: String,
        key: String,
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

export const VideoModel = model('videos', schema)
export type VideoSchema = InferSchemaType<typeof schema>
export type Video = HydratedDocumentFromSchema<typeof schema>
