import { sign, verify } from 'jsonwebtoken'
import env from '../env'

type Payload = {
  id: string
  email: string
  role: string
}

type TokenType = 'access' | 'refresh'

export class TokenManager {
  static decode = <T>(token: string, type: TokenType) =>
    new Promise<T>((resolve, reject) => {
      const secret = type === 'access' ? env.JWT_SECRET : env.JWT_SECRET_REFRESH_TOKEN
      
      verify(token, secret, (err, payload) => {
        if (err) reject(err)
        else resolve(payload as T)
      })
    })

  static sign = (type: TokenType, payload: Payload) => {
    const isAccessToken = type === 'access'
    const secret = isAccessToken ? env.JWT_SECRET : env.JWT_SECRET_REFRESH_TOKEN
    return sign(payload, secret, { expiresIn: isAccessToken ? '7d' : '30d' })
  }

  static logout = (payload: Payload) => sign(payload, env.JWT_SECRET, { expiresIn: '1' })
}
