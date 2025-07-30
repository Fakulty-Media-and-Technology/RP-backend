import { FilterQuery } from 'mongoose'
import { UserModel, UserSchema } from '../models/users.model'

export type Filter = FilterQuery<UserSchema>

export async function* fetchManyUsersByFilterGenerator(filter: Filter) {
  const limit = 2000
  let skip = 0

  while (true) {
    try {
      const users = await UserModel.find(filter).sort({ _id: -1 }).skip(skip).limit(limit)
      // .select('_id')

      if (users.length === 0) {
        break
      }

      yield users
      skip += limit
    } catch (e: any) {
      console.error('fetchAllUsersByFilterGenerator error', e.message || e)
      break
    }
  }
}
