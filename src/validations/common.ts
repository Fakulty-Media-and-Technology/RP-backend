import Joi from 'joi'

export const MONGO_DB_OBJECT_ID_REG = /^[0-9A-Fa-f]{24}$/
export const NUMERIC_REG = /^\d+$/
export const FLOATS_REG = /[-+]?[0-9]*\.?[0-9]+/

export const STRING_SCHEMA = Joi.string()
export const MONGO_DB_OBJECT_ID_SCHEMA = Joi.string().pattern(MONGO_DB_OBJECT_ID_REG)
export const MONGO_DB_OBJECT_ID_ARRAY_SCHEMA = Joi.array().items(MONGO_DB_OBJECT_ID_SCHEMA)
export const CURRENCY_SCHEMA = STRING_SCHEMA.valid('USD', 'NGN')

export const PHOTO_SCHEMA_WITH_CONTENT_TYPE = Joi.object({
  Bucket: STRING_SCHEMA.required(),
  Key: STRING_SCHEMA.required(),
  ContentType: STRING_SCHEMA.required(),
})

export const PHOTO_SCHEMA = Joi.object({
  Bucket: STRING_SCHEMA.required(),
  Key: STRING_SCHEMA.required(),
})

export const POSTER_SCHEMA = Joi.object({
  bucket: STRING_SCHEMA.required(),
  key: STRING_SCHEMA.required(),
  dimension: STRING_SCHEMA.valid('landscape', 'portrait').required(),
})

export const LIVE_TYPE_SCHEMA = STRING_SCHEMA.valid(
  'channel',
  'event',
  'tvshow',
  'podcast',
  'sport',
)

export const ISO_STRING_SCHEMA = STRING_SCHEMA.isoDate()

export const VIDEO_CLASS_SCHEMA = STRING_SCHEMA.valid('free', 'ad', 'exclusive', 'premium')

export const updateUserProfileSchema = {
  body: Joi.object({
    firstName: STRING_SCHEMA,
    lastName: STRING_SCHEMA,
    email: STRING_SCHEMA.email(),
    countryCode: STRING_SCHEMA,
    mobile: STRING_SCHEMA,
    password: STRING_SCHEMA,
    prevPassword: STRING_SCHEMA,
    gender: STRING_SCHEMA.valid('male', 'female', 'nil'),
    role: STRING_SCHEMA.valid(
      'customer',
      'channel',
      'tvshow',
      'event',
      'podcast',
      'admin',
      'superadmin',
    ),
    dob: STRING_SCHEMA.isoDate(),
    country: STRING_SCHEMA,
  }).and('password', 'prevPassword'),

  params: Joi.object({
    userId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
  }),
}

export const intitiatePaymentSchema = {
  body: Joi.object({
    amount: Joi.number().strict().required(),
    currency: CURRENCY_SCHEMA.required(),
    fullName: STRING_SCHEMA,
    method: STRING_SCHEMA.valid('flutterwave', 'wallet').required(),

    useCase: STRING_SCHEMA.valid(
      'subscription',
      'topup',
      'vote',
      'donate',
      'live schedule',
      'live schedule ext',
      'live-watch-exclusive',
      'video-watch-premium',
      'video-watch-exclusive',
    ).required(),

    email: Joi.when('useCase', {
      is: 'live schedule',
      then: STRING_SCHEMA.required().email(),
      otherwise: STRING_SCHEMA.email(),
    }),

    liveId: Joi.when('useCase', {
      is: 'live schedule ext',
      then: MONGO_DB_OBJECT_ID_SCHEMA.required(),
      otherwise: Joi.when('useCase', {
        is: 'donate',
        then: MONGO_DB_OBJECT_ID_SCHEMA.required(),
        otherwise: Joi.when('useCase', {
          is: 'live-watch-exclusive',
          then: MONGO_DB_OBJECT_ID_SCHEMA.required(),
          otherwise: Joi.forbidden(),
        }),
      }),
    }),

    videoId: Joi.when('useCase', {
      is: 'video-watch-premium',
      then: MONGO_DB_OBJECT_ID_SCHEMA.required(),
      otherwise: Joi.when('useCase', {
        is: 'video-watch-exclusive',
        then: MONGO_DB_OBJECT_ID_SCHEMA.required(),
        otherwise: Joi.forbidden(),
      }),
    }),

    voteInfoId: Joi.when('useCase', {
      is: 'vote',
      then: MONGO_DB_OBJECT_ID_SCHEMA.required(),
      otherwise: Joi.forbidden(),
    }),

    contestantId: Joi.when('useCase', {
      is: 'vote',
      then: MONGO_DB_OBJECT_ID_SCHEMA.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
}

export const authorizePaymentSchema = {
  body: Joi.object({
    amount: Joi.number().strict().required(),
    paymentDetailsId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
  }),
}
