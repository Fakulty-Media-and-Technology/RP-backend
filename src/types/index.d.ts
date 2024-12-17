import { Types } from 'mongoose'
import { User } from '../models/users.model'

export type LoggedInUser = Omit<User, 'role'> & {
  role: User['role'] | 'guest'
}

export type StringOrObjectId = Types.ObjectId | string

export {}

declare global {
  namespace Express {
    export interface Request {
      user: LoggedInUser | undefined
    }
  }
}
