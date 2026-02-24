import env from '../env'
import { UserDocument, UserSchema } from '../models/users.model'
import { UserRepo } from '../repositories/UserRepo'
import { LoggedInUser } from '../types'
import { Catch } from '../utils/Catch'
import { TokenManager } from '../utils/jwt'
import { OperationalError } from '../utils/OperationalError'

export type AuthHeaderKey = 'superadmin-auth' | 'customer-auth' | 'clients-auth' | 'admin-auth'

export class AuthMiddleware {
  private static _checkRolePermission = (authHeaderType: AuthHeaderKey, user: UserDocument) => {
    switch (authHeaderType) {
      case 'clients-auth':
        const permittedRoles: UserSchema['role'][] = ['channel', 'tvshow', 'event', 'podcast']

        if (!permittedRoles.includes(user.role)) {
          throw new OperationalError('Access Denied, clients Route', 403)
        }
        break

      case 'superadmin-auth':
        if (user.role !== 'superadmin') {
          throw new OperationalError('Access Denied, superadmin Route', 403)
        }
        break

      case 'admin-auth':
        if (user.role !== 'admin') {
          throw new OperationalError('Access Denied, admin Route', 403)
        }
        break

      case 'customer-auth':
        if (user.role !== 'customer') {
          throw new OperationalError('Access Denied, customer Route', 403)
        }
        break

      default:
        console.error(
          '🛑AuthController._checkRolePermission should never log this line. Investigate',
        )

        throw new OperationalError('invalid auth', 401)
    }
  }

  static authenticateRequest = (authHeaderkey: AuthHeaderKey) =>
    Catch.async(async (req, _, next) => {
      const token = req.headers[authHeaderkey]

      if (typeof token !== 'string') {
        throw new OperationalError('User not logged in', 401)
      }

      if (token === env.GUEST_TOKEN) {
        req.user = {
          first_name: 'guest',
          last_name: 'user',
          role: 'guest',
        } as unknown as LoggedInUser
        return next()
      }

      // this throws and is handled at the application layer
      const { id } = await TokenManager.decode(token, 'access')
      const userDocument = await UserRepo.getUserById(id)

      if (userDocument === null) {
        throw new OperationalError('User does not exist', 401)
      }

      userDocument.throwIfDeleted()

      if (userDocument.suspended) {
        throw new OperationalError('You are suspended', 403)
      }

      this._checkRolePermission(authHeaderkey, userDocument)

      req.user = userDocument
      next()
    })
}
