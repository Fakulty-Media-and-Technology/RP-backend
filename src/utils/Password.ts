import bcrypt from 'bcrypt'

export class Password {
  static isStrong = (password: string) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[a-zA-Z]).{8,}$/.test(password)
  
  static encrypt = async (password: string) => bcrypt.hash(password, 12)

  static compare = async (plainPassword: string, hashedPassword: string) =>
    bcrypt.compare(plainPassword, hashedPassword)
}
