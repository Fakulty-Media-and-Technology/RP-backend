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

  // ??
  MEDIA_SERVER_PORT: process.env.MEDIA_SERVER_PORT,
  EVENT_HOURLY_CHARGES: process.env.EVENT_HOURLY_CHARGES,

  // livestream
  RP_HLSURL: process.env.RP_HLSURL,
  RP_RTMPURL: process.env.RP_RTMPURL,

  // emails
  MAIL_SENDER: process.env.MAIL_SENDER,
  MAILTRAP_USER: process.env.MAILTRAP_USER,
  MAILTRAP_PASS: process.env.MAILTRAP_PASS,

  //   secrets
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN,
  
  // *** new
  MIN_WITHDRAWAL_AMOUNT: Number(process.env.MIN_WITHDRAWAL_AMOUNT ?? 50000),
  WITHDRAWAL_PERCENT: Number(process.env.WITHDRAWAL_PERCENT ?? 15),
})

export default env
