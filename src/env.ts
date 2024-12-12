
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

  // emails
  MAIL_SENDER: process.env.MAIL_SENDER,
  MAILTRAP_USER: process.env.MAILTRAP_USER,
  MAILTRAP_PASS: process.env.MAILTRAP_PASS,

  //   secrets
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN,
})

export default env
