import 'dotenv/config'

const NUMERIC_REG = /^\d+$/

const setToNumberWithDefault = (key: string, defaultNum: number) => {
  const val = process.env[key]
  if (val == null) return defaultNum

  if (!NUMERIC_REG.test(val)) {
    throw new Error(`optional env variable ${key} must be numeric if present`)
  }

  return Number(val)
}

const getValidEnv = <T extends Record<string, any>>(variables: Partial<T>) => {
  Object.entries(variables).forEach(([key, val]) => {
    if (val === undefined) {
      throw new Error(`${key} is missing from env file`)
    }
  })

  return variables as Required<T>
}

export const env = getValidEnv({
  //
  PORT: process.env.PORT,
  MONGO_DB_URL: process.env.MONGO_DB_URL,
  NODE_ENV: process.env.NODE_ENV,

  // emails
  MAIL_SENDER: process.env.MAIL_SENDER,
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD,
  MAIL_PORT: setToNumberWithDefault('MAIL_PORT', 465),

  //   secrets
  JWT_SECRET: process.env.JWT_SECRET,
  GUEST_TOKEN: process.env.GUEST_TOKEN,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN,

  // flutterwave  secrets
  FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
  FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
  FLUTTERWAVE_SECRET_HASH: process.env.FLUTTERWAVE_SECRET_HASH,
  FLUTTERWAVE_ENCYPTION_KEY: process.env.FLUTTERWAVE_ENCYPTION_KEY,

  // AWS
  S3REGION: process.env.S3REGION,
  S3SECRET_KEY: process.env.S3SECRET_KEY,
  S3ACCESS_KEY: process.env.S3ACCESS_KEY,
  IAM_ROLE_ARN: process.env.IAM_ROLE_ARN,
  CDN_IMAGES_BASE_URL: process.env.CDN_IMAGES_BASE_URL,

  S3_IMAGE_BUCKET: process.env.S3_IMAGE_BUCKET,

  get S3_VIDEO_BUCKET() {
    return process.env.S3BUCKET
  },

  // new
  GIFT_CARD_AUTHORIZATION_TOKEN: process.env.GIFT_CARD_AUTHORIZATION_TOKEN ?? 'abcdef',

  // media
  KEY_PAIR_ID: process.env.KEY_PAIR_ID,
  CFS_PRIVATE_KEY: process.env.CFS_PRIVATE_KEY,
  CFSDISTRIBUTION: process.env.CFSDISTRIBUTION,

  // *** payments
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  WAVE_API_KEY: process.env.WAVE_API_KEY,

  // *** charges
  EVENT_HOURLY_CHARGES_NGN: setToNumberWithDefault('EVENT_HOURLY_CHARGES_NGN', 10000),
  EVENT_HOURLY_CHARGES_USD: setToNumberWithDefault('EVENT_HOURLY_CHARGES_USD', 10),
  MIN_WITHDRAWAL_AMOUNT_USD: setToNumberWithDefault('MIN_WITHDRAWAL_AMOUNT_USD', 50000),
  MIN_WITHDRAWAL_AMOUNT_NGN: setToNumberWithDefault('MIN_WITHDRAWAL_AMOUNT_NGN', 50000),
  PAYOUT_SERVICE_CHARGE: setToNumberWithDefault('PAYOUT_SERVICE_CHARGE', 15),
  NGN_PREMIUM_CONTENT_COST: setToNumberWithDefault('NGN_PREMIUM_CONTENT_COST', 400),
  USD_PREMIUM_CONTENT_COST: setToNumberWithDefault('USD_PREMIUM_CONTENT_COST', 10),

  // livestream
  RP_RTMP_APP_NAME: process.env.RP_RTMP_APP_NAME,
  RP_RTMP_BASE_URL: process.env.RP_RTMP_BASE_URL,
  RP_HLS_BASE_URL: process.env.RP_HLS_BASE_URL,
  // RP_RMTP_AUTH_SECRET: process.env.RP_RMTP_AUTH_SECRET,
  // RP_HLS_HTTP_PORT: setToNumberWithDefault('RP_HLS_HTTP_PORT', 8888),
  // RP_RTMP_PORT: setToNumberWithDefault('RP_RTMP_PORT', 1935),


  get RP_RTMP_SERVER_URL() {
    return this.IS_PROD ? this.RP_RTMP_BASE_URL : `rmtp://localhost/live`
  },

  get RP_PLAYBACK_URL() {
    return this.IS_PROD ? this.RP_HLS_BASE_URL : `http://localhost/live/`
  },

  get IS_PROD() {
    return this.NODE_ENV === 'production'
  },
})

export default env
