import Joi from 'joi'

import {
  CURRENCY_SCHEMA,
  FLOATS_REG,
  ISO_STRING_SCHEMA,
  LIVE_TYPE_SCHEMA,
  MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,
  MONGO_DB_OBJECT_ID_SCHEMA,
  NUMERIC_REG,
  PHOTO_SCHEMA,
  STRING_SCHEMA,
  VIDEO_CLASS_SCHEMA,
} from './common'

export const addEpisodeSchema = Joi.object({
  title: STRING_SCHEMA.required(),
  description: STRING_SCHEMA.optional(),
  videoLink: STRING_SCHEMA.optional(),
  trailerLink: STRING_SCHEMA.optional(),

  video: Joi.object().optional(), // file
  trailer: Joi.object().optional(), // file
})
  .xor('trailerLink', 'trailer')
  .xor('video', 'videoLink')

export const addMovieOrSkitSchema = Joi.object({
  title: STRING_SCHEMA.required(),
  pg: STRING_SCHEMA.required(),
  releasedDate: ISO_STRING_SCHEMA.required(),
  primaryColor: STRING_SCHEMA.required(),

  // enums
  category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
  genre: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.max(3).required(),
  cast: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.max(10).required(),

  // maps to details in UI
  description: STRING_SCHEMA.required(),
  runtime: STRING_SCHEMA,
  defaultRating: STRING_SCHEMA.pattern(FLOATS_REG),

  // files
  landscapePoster: Joi.object().required(),
  portraitPoster: Joi.object().required(),

  trailer: Joi.object().optional(), // file
  trailerLink: STRING_SCHEMA.optional(),

  active: Joi.boolean(),
  showViews: Joi.boolean(),

  video: Joi.object().optional(), //file
  videoLink: STRING_SCHEMA.optional(),
  vidClass: STRING_SCHEMA.valid('free', 'ad', 'exclusive', 'premium').required(),

  expiryDate: ISO_STRING_SCHEMA,

  currency: Joi.when('vidClass', {
    is: 'exclusive',
    then: CURRENCY_SCHEMA.required(),
    otherwise: Joi.forbidden(),
  }),

  amount: Joi.when('vidClass', {
    is: 'exclusive',
    then: Joi.number().strict().required(),
    otherwise: Joi.forbidden(),
  }),
})
  .xor('trailerLink', 'trailer')
  .xor('video', 'videoLink')

export const addSeriesSchema = Joi.object({
  title: STRING_SCHEMA.required(),
  pg: STRING_SCHEMA.pattern(NUMERIC_REG).required(),
  vidClass: VIDEO_CLASS_SCHEMA.required(),
  category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
  releasedDate: ISO_STRING_SCHEMA.required(),
  runtime: STRING_SCHEMA.required(),
  primaryColor: STRING_SCHEMA.required(),
  defaultRating: STRING_SCHEMA.pattern(FLOATS_REG).required(),

  description: STRING_SCHEMA,

  // files
  landscapePoster: Joi.object().required(),
  portraitPoster: Joi.object().required(),

  trailer: Joi.object().optional(), // file
  trailerLink: STRING_SCHEMA.optional(),

  active: Joi.boolean(),
  showViews: Joi.boolean(),

  //
  genre: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
  cast: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
  expiryDate: ISO_STRING_SCHEMA,

  currency: Joi.when('vidClass', {
    is: 'exclusive',
    then: CURRENCY_SCHEMA.required(),
    otherwise: Joi.forbidden(),
  }),

  amount: Joi.when('vidClass', {
    is: 'exclusive',
    then: Joi.number().strict().required(),
    otherwise: Joi.forbidden(),
  }),
}).xor('trailerLink', 'trailer')

export const addMusicVideoSchema = Joi.object({
  title: STRING_SCHEMA.required(),
  pg: STRING_SCHEMA.required(),
  vidClass: VIDEO_CLASS_SCHEMA.required(),
  category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
  releasedDate: ISO_STRING_SCHEMA.required(),
  runtime: STRING_SCHEMA.required(),
  defaultRating: STRING_SCHEMA.pattern(FLOATS_REG).required(),
  artistName: STRING_SCHEMA.required(),
  expiryDate: ISO_STRING_SCHEMA,
  primaryColor: STRING_SCHEMA.required(),

  description: STRING_SCHEMA,

  genre: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,

  // files
  landscapePoster: Joi.object().required(),
  portraitPoster: Joi.object().required(),

  video: Joi.object().optional(), // file
  videoLink: STRING_SCHEMA.optional(),

  active: Joi.boolean(),
  showViews: Joi.boolean(),

  trailerLink: STRING_SCHEMA.optional(), // file
  trailer: Joi.object().optional(),

  currency: Joi.when('vidClass', {
    is: 'exclusive',
    then: CURRENCY_SCHEMA.required(),
    otherwise: Joi.forbidden(),
  }),

  amount: Joi.when('vidClass', {
    is: 'exclusive',
    then: Joi.number().strict().required(),
    otherwise: Joi.forbidden(),
  }),
})
  .xor('trailerLink', 'trailer')
  .xor('video', 'videoLink')

export const editVideoSchema = Joi.object({
  title: STRING_SCHEMA,
  pg: STRING_SCHEMA,
  vidClass: VIDEO_CLASS_SCHEMA,
  releasedDate: ISO_STRING_SCHEMA,
  runtime: STRING_SCHEMA,
  defaultRating: STRING_SCHEMA.pattern(FLOATS_REG),
  artistName: STRING_SCHEMA,
  expiryDate: ISO_STRING_SCHEMA,
  description: STRING_SCHEMA,
  primaryColor: STRING_SCHEMA,

  category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,
  genre: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,
  cast: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,

  amount: Joi.number().strict(),

  // files
  landscapePoster: Joi.object(),
  portraitPoster: Joi.object(),

  video: Joi.object(), // file
  videoLink: STRING_SCHEMA,

  active: Joi.boolean(),
  upcoming: Joi.boolean(),
  showViews: Joi.boolean(),

  trailerLink: STRING_SCHEMA, // file
  trailer: Joi.object(),
})

export const addSubtitleSchema = Joi.object({
  parentId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
  parentType: STRING_SCHEMA.valid('vod', 'episode').required(),
  language: STRING_SCHEMA.required(),
  subtitle: Joi.object().required(),
})

export const getPhotoURLSchema = {
  body: Joi.object({
    bucket: STRING_SCHEMA.required(),
    key: STRING_SCHEMA.required(),
  }),
}

export const addLiveSchema = Joi.object({
  clientId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
  paymentId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
  title: STRING_SCHEMA.required(),
  subTitle: STRING_SCHEMA.required(),
  pg: STRING_SCHEMA.required(),
  start: ISO_STRING_SCHEMA.required(),
  expiry: ISO_STRING_SCHEMA.required(),
  coverPhoto: Joi.object().required(),
  category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,
  previewVideo: Joi.object(),
  description: STRING_SCHEMA,
  vidClass: STRING_SCHEMA.valid('free', 'ad', 'exclusive', 'premium').required(),
  type: LIVE_TYPE_SCHEMA.required(),
  sponsored: Joi.boolean(),
  upcoming: Joi.boolean(),
  popular: Joi.boolean(),
  location: STRING_SCHEMA,

  currency: Joi.when('vidClass', {
    is: 'exclusive',
    then: CURRENCY_SCHEMA.required(),
    otherwise: Joi.forbidden(),
  }),

  amount: Joi.when('vidClass', {
    is: 'exclusive',
    then: Joi.number().strict().required(),
    otherwise: Joi.forbidden(),
  }),
})

export const createUpcomingEventSchema = Joi.object({
  title: STRING_SCHEMA.required(),
  type: STRING_SCHEMA.valid('movie', 'series', 'music video', 'documentary', 'skit').required(),
  details: STRING_SCHEMA.required(),
  releaseDate: ISO_STRING_SCHEMA.required(),
  active: Joi.boolean(),
  trailerLink: STRING_SCHEMA,
  trailer: Joi.object(),
  portraitPhoto: Joi.object().required(),
  landscapePhoto: Joi.object().required(),
})

export const createPlanSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    months: Joi.number().min(0).valid(1, 3, 6, 12).required(),
    price: Joi.number().min(0).required(),
    details: STRING_SCHEMA.required(),
  }),
}

export const updatePlanSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.optional(),
    months: Joi.number().min(0).valid(1, 3, 6, 12).optional(),
    price: Joi.number().min(0).optional(),
    details: STRING_SCHEMA.optional(),
  }),
}

export const createTrailerSchema = {
  body: Joi.object({
    video_id: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    video_title: STRING_SCHEMA.optional(),
    details: STRING_SCHEMA.optional(),
    video_upload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
  }),
}

export const updateTrailerSchema = {
  body: Joi.object({
    video_id: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    video_title: STRING_SCHEMA.optional(),
    details: STRING_SCHEMA.optional(),
    video_upload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
  }).or('video_id', 'video_title', 'details', 'video_upload'),
}

export const createGiftCardSchema = {
  body: Joi.object({
    amount: Joi.number().min(0).required(),
    currency: CURRENCY_SCHEMA.required(),
  }),
}

export const updatePayOutReqStatusSchema = {
  body: Joi.object({
    status: STRING_SCHEMA.valid('processing', 'reversed', 'rejected', 'completed').required(),
  }),
}

export const addFeaturedContentSchema = {
  body: Joi.object({
    id: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    expiry: STRING_SCHEMA.isoDate().required(),
    type: STRING_SCHEMA.valid('event', 'vod').required(),
  }),
}

export const addGenreSchema = {
  body: Joi.object({
    name: STRING_SCHEMA.required(),
    position: Joi.number().required(),
  }),
}

export const addCastSchema = {
  body: Joi.object({
    name: STRING_SCHEMA.required(),
    title: STRING_SCHEMA.required(),
    description: STRING_SCHEMA.required(),
    selectButtonType: STRING_SCHEMA.valid('book-now', 'fan-page'),
    link: STRING_SCHEMA,
  }),
}

export const editCastSchema = {
  body: Joi.object({
    name: STRING_SCHEMA,
    title: STRING_SCHEMA,
    description: STRING_SCHEMA,
    selectButtonType: STRING_SCHEMA.valid('book-now', 'fan-page'),
    link: STRING_SCHEMA,
  }),
}

export const addCategorySchema = {
  body: Joi.object({
    name: STRING_SCHEMA.required(),
    position: Joi.number().required(),
  }),
}

export const updateCategorySchema = {
  body: Joi.object({
    name: STRING_SCHEMA,
    position: Joi.number(),
  }).or('name', 'position'),
}

export const updateGenreSchema = updateCategorySchema

export const createAdminORSuperAdminSchema = {
  body: Joi.object({
    first_name: STRING_SCHEMA.required(),
    last_name: STRING_SCHEMA.required(),
    email: STRING_SCHEMA.email().required(),
    password: STRING_SCHEMA.required(),
    cpassword: STRING_SCHEMA.required(),
    country_code: STRING_SCHEMA.required(),
    mobile: STRING_SCHEMA.required(),
    gender: STRING_SCHEMA.valid('male', 'female', 'nil'),
    dob: STRING_SCHEMA.isoDate(),
    country: STRING_SCHEMA,
  }),
}

export const createClientSchema = {
  body: Joi.object({
    first_name: STRING_SCHEMA.required(),
    last_name: STRING_SCHEMA.required(),
    email: STRING_SCHEMA.email().required(),
    password: STRING_SCHEMA.required(),
    cpassword: STRING_SCHEMA.required(),
    country_code: STRING_SCHEMA.required(),
    mobile: STRING_SCHEMA.required(),
    verified: Joi.boolean().required(),
    client_type: STRING_SCHEMA.valid('channel', 'tvshow', 'event', 'podcast').required(),
    gender: STRING_SCHEMA.valid('male', 'female', 'nil'),
    dob: STRING_SCHEMA.isoDate(),
    country: STRING_SCHEMA,
  }),
}

export const createAdSchema = Joi.object({
  title: STRING_SCHEMA.required(),
  type: STRING_SCHEMA.valid('general', 'movie_ad', 'web', 'mobile').required(),
  brand: STRING_SCHEMA.required(),
  link: STRING_SCHEMA.required(),
  cta: STRING_SCHEMA.required(),
  duration: Joi.number().required(),
  start: STRING_SCHEMA.isoDate().required(),
  expiry: STRING_SCHEMA.isoDate().required(),
  active: Joi.boolean().required(),
  videoFile: Joi.object().required(),
  imageFile: Joi.object().required(),
})

export const upcomingAllGetSchema = {
  query: Joi.object({
    page: Joi.number(),
    limit: Joi.number(),
  }),
}

export const createContestantSchema = {
  body: Joi.object({
    liveId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    names: STRING_SCHEMA.required(),
    occupation: STRING_SCHEMA.required(),
    bio: STRING_SCHEMA.required(),
    contact: STRING_SCHEMA.required(),
  }),
}

export const sendPushNotificationSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    body: STRING_SCHEMA.required(),
    type: STRING_SCHEMA,
    metadata: Joi.alternatives().try(Joi.string(), Joi.object()),
  }),
}
