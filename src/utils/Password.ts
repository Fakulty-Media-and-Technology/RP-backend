import bcrypt from 'bcrypt'
import { OperationalError } from './OperationalError'

export class Password {
  static isStrong = (password: string) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[a-zA-Z]).{8,}$/.test(password)

  static encrypt = async (password: string) => bcrypt.hash(password, 12)

  static compare = async (plainPassword: string, hashedPassword: string) =>
    bcrypt.compare(plainPassword, hashedPassword)

  static checkIsStrongPasswordOrThrow = (password: string) => {
    if (this.isStrong(password)) return

    throw new OperationalError(
      'password is too weak: use capital, small letter, interger and not less than 8 character',
      400,
    )
  }

  static checkIsSameOrThrow = (firstPassword: string, secondPassword: string) => {
    if (firstPassword === secondPassword) return
    throw new OperationalError('Passwords do not match', 400)
  }
}
