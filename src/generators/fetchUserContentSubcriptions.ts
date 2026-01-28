import { ContentSubscribersModel } from '../models/content.subscribers.model'
import { MongoDBObjectId } from '../types/general'

export async function* fetchUserContentSubGenerator(userId: string | MongoDBObjectId) {
  const limit = 40
  let skip = 0

  while (true) {
    try {
      const subs = await ContentSubscribersModel.find({ user: userId }).skip(skip).limit(limit)

      if (subs.length === 0) {
        break
      }

      yield subs
      skip += limit
    } catch (e: any) {
      console.error('fetchUserContentSubGenerator error', e.message || e)
      break
    }
  }
}
