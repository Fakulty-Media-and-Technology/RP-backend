import { sign, verify } from 'jsonwebtoken'
import env from '../env'
import { UserDocument } from '../models/users.model'

export type TokenPayload = {
  id: string
  email: string
  role: string
}

type TokenType = 'access' | 'refresh'

export class TokenManager {
  static makePayload = (userDocument: UserDocument): TokenPayload => ({
    id: userDocument._id.toString(),
    email: userDocument.email,
    role: userDocument.role,
  })

  static decode = <T extends TokenPayload>(token: string, type: TokenType) =>
    new Promise<T>((resolve, reject) => {
      const secret = type === 'access' ? env.JWT_SECRET : env.JWT_SECRET_REFRESH_TOKEN

      verify(token, secret, (err, payload) => {
        if (err) reject(err)
        else resolve(payload as T)
      })
    })

  static sign = (type: TokenType, payload: TokenPayload) => {
    const isAccessToken = type === 'access'
    const secret = isAccessToken ? env.JWT_SECRET : env.JWT_SECRET_REFRESH_TOKEN
    return sign(payload, secret, { expiresIn: isAccessToken ? '7d' : '60d' })
  }

  static logout = (payload: TokenPayload) => sign(payload, env.JWT_SECRET, { expiresIn: '1' })
}
