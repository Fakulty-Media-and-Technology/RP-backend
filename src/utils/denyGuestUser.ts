import { LoggedInUser } from '../types'
import { OperationalError } from './OperationalError'

export const denyGuestUser = (user: LoggedInUser) => {
  if (!user._id && user.role === 'guest') {
    throw new OperationalError('you are not authorized', 403)
  }
}
