import { connect, connection } from 'mongoose'
import env from '../env'

export const connectMongoDB = async (url = env.MONGO_DB_URL) => {
  if (connection.readyState === 1) {
    return 'Already Connected to MongoDB'
  }

  await connect(url)
  return 'Connected to mongoDB succesfully'
}
