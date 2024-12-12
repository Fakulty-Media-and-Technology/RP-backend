import { User } from '../models/users.model'

export type LoggedInUser = User

export {}

declare global {
  namespace Express {
    export interface Request {
      user: LoggedInUser | undefined
    }
  }
}
