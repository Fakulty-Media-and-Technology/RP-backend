import { UserDocument } from '../models/users.model'
import { LoggedInUser } from '../types'

export const hidePrivateProps = (user: UserDocument | LoggedInUser) => ({
  ...user.toObject(),
  auth_code: undefined,
  auth_expiry: undefined,
  verified: undefined,
  approved: undefined,
  suspended: undefined,
  updatedAt: undefined,
  __v: undefined,
  pin: undefined,
  password: undefined,
})
