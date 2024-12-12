import bcrypt from 'bcrypt'

export class Password {
  static encrypt = async (password: string) => bcrypt.hash(password, 12)

  static compare = async (plainPassword: string, hashedPassword: string) =>
    bcrypt.compare(plainPassword, hashedPassword)
}
