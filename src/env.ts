import 'dotenv/config'

const NUMERIC_REG = /^\d+$/

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
  NODE_ENV: process.env.NODE_ENV || 'production',

  get IS_PROD() {
    return this.NODE_ENV === 'production'
  },

  // livestream
  RP_RTMP_APP_NAME: process.env.RP_RTMP_APP_NAME || 'live',
  RP_RTMP_BASE_URL: process.env.RP_RTMP_BASE_URL || 'rtmp://rtmp.reeplay.app',
  RP_HLS_BASE_URL: process.env.RP_HLS_BASE_URL || 'https://live.reeplay.app',
  RP_RMTP_AUTH_SECRET: process.env.RP_RMTP_AUTH_SECRET,

  get RP_HLS_HTTP_PORT() {
    const envHlsPort = process.env.RP_HLS_HTTP_PORT

    if (envHlsPort == null) {
      return 8888
    }

    if (!NUMERIC_REG.test(envHlsPort)) {
      throw new Error(`optional env variable RP_HLS_HTTP_PORT must be numeric if present`)
    }

    return Number(envHlsPort)
  },

  get RP_RTMP_PORT() {
    const envRtmpPort = process.env.RP_RTMP_PORT

    if (envRtmpPort == null) {
      return 1935
    }

    if (!NUMERIC_REG.test(envRtmpPort)) {
      throw new Error(`optional env variable RP_RTMP_PORT must be numeric if present`)
    }

    return Number(envRtmpPort)
  },

  get RP_RTMP_URL() {
    const baseURL = this.IS_PROD ? this.RP_RTMP_BASE_URL : `rmtp://localhost`
    return `${baseURL}/${this.RP_RTMP_APP_NAME}`
  },

  get RP_HLS_URL() {
    const baseURL = this.IS_PROD
      ? this.RP_HLS_BASE_URL
      : `http://localhost:${this.RP_HLS_HTTP_PORT}`

    return `${baseURL}/${this.RP_RTMP_APP_NAME}/`
  },

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

  // *** payments
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,

  get EVENT_HOURLY_CHARGES() {
    const envCharges = process.env.EVENT_HOURLY_CHARGES

    if (envCharges == null) {
      return 10000
    }

    if (!NUMERIC_REG.test(envCharges)) {
      throw new Error(`optional env variable EVENT_HOURLY_CHARGES must be numeric if present`)
    }

    return Number(envCharges)
  },

  get WITHDRAWAL_PERCENT() {
    const envPercent = process.env.WITHDRAWAL_PERCENT

    if (envPercent == null) {
      return 15
    }

    if (!NUMERIC_REG.test(envPercent)) {
      throw new Error(`optional env variable WITHDRAWAL_PERCENT must be numeric if present`)
    }

    return Number(envPercent)
  },

  get MIN_WITHDRAWAL_AMOUNT() {
    const envMinWithdrawalAmt = process.env.MIN_WITHDRAWAL_AMOUNT

    if (envMinWithdrawalAmt == null) {
      return 50000
    }

    if (!NUMERIC_REG.test(envMinWithdrawalAmt)) {
      throw new Error(`optional env variable MIN_WITHDRAWAL_AMOUNT must be numeric if present`)
    }

    return Number(envMinWithdrawalAmt)
  },
})

export default env
