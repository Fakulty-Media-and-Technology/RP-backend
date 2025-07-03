import { Types } from 'mongoose'
import { UserDocument } from '../models/users.model'

export type MulterFile = Express.Multer.File

export type LoggedInUser = Omit<UserDocument, 'role'> & {
  role: UserDocument['role'] | 'guest'
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
