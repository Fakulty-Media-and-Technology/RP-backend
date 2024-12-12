import { LoggedInUser } from '../types'
import { OperationalError } from './OperationalError'

export class GetDefined {
  static loggedInUser = (maybeUser: LoggedInUser | undefined | null) => {
    if (maybeUser == null) {
      throw new OperationalError('Please login', 401)
    }

    return maybeUser
  }
}
