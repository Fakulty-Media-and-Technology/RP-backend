import 'dotenv/config'

const getValidEnv = <T extends Record<string, any>>(variables: Partial<T>) => {
  Object.entries(variables).forEach(([key, val]) => {
    if (val === undefined) {
      throw new Error(`${key} is missing from env file`)
    }
  })

  return variables as Required<T>
}

export const env = getValidEnv({
  PORT: process.env.PORT,
  MONGO_DB_URL: process.env.MONGO_DB_URL,
  NODE_ENV: process.env.NODE_ENV ?? 'production',

  get IS_PROD() {
    return this.NODE_ENV === 'production'
  },

  // nms
  MEDIA_SERVER_HTTP_PORT: Number(process.env.MEDIA_SERVER_HTTP_PORT || 8888),
  MEDIA_SERVER_PORT_RMTP_PORT: Number(process.env.MEDIA_SERVER_PORT_RMTP_PORT || 8888),
  EVENT_HOURLY_CHARGES: process.env.EVENT_HOURLY_CHARGES,

  // payments
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,

  // livestream
  RP_HLSURL: process.env.RP_HLSURL,
  RP_RTMPURL: process.env.RP_RTMPURL,

  // emails
  MAIL_SENDER: process.env.MAIL_SENDER,
  MAILTRAP_USER: process.env.MAILTRAP_USER,
  MAILTRAP_PASS: process.env.MAILTRAP_PASS,

  //   secrets
  JWT_SECRET: process.env.JWT_SECRET,
  GUEST_TOKEN: process.env.GUEST_TOKEN,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN,

  // AWS
  S3REGION: process.env.S3REGION,
  S3SECRET_KEY: process.env.S3SECRET_KEY,
  S3ACCESS_KEY: process.env.S3ACCESS_KEY,
  IAM_ROLE_ARN: process.env.IAM_ROLE_ARN,

  // media
  KEY_PAIR_ID: process.env.KEY_PAIR_ID,
  CFS_PRIVATE_KEY: process.env.CFS_PRIVATE_KEY,
  CFSDISTRIBUTION: process.env.CFSDISTRIBUTION,

  // *** new
  MIN_WITHDRAWAL_AMOUNT: Number(process.env.MIN_WITHDRAWAL_AMOUNT ?? 50000),
  WITHDRAWAL_PERCENT: Number(process.env.WITHDRAWAL_PERCENT ?? 15),
})

export default env
