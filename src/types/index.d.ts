import { User } from '../models/users.model'

export type LoggedInUser = Omit<User, 'role'> & {
  role: User['role'] | 'guest'
}

export {}

declare global {
  namespace Express {
    export interface Request {
      user: LoggedInUser | undefined
    }
  }
}
