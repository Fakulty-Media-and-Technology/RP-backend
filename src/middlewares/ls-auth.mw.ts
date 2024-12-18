import { UserModel } from '../models/users.model'
import { TokenManager } from '../utils/jwt'
import { OperationalError } from '../utils/OperationalError'

export const liveStreamAuth = async (token: string | undefined | null) => {
  if (!token) {
    throw new OperationalError('User not logged-in', 404)
  }

  const authUser = await TokenManager.decode(token, 'access')
  const user = await UserModel.findById(authUser.id)

  if (!user) {
    throw new OperationalError('user not found', 404)
  }

  if (user.suspended) {
    throw new OperationalError('You are Suspended, please contact the customer service', 403)
  }

  return user
}
