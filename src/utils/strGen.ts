import crypto from 'node:crypto'

export const authCode = (digit: number) => {
  let pin = ''

  for (let i = 0; i < digit; i++) {
    const num = Math.floor(Math.random() * 10)
    pin += num
  }

  return pin
}

export const genRandUniqId = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charsLength = chars.length
  const randomBytes = crypto.randomBytes(length)

  let result = ''

  for (let i = 0; i < length; i++) {
    const indexedByte = randomBytes[i]
    const randIndex = indexedByte % charsLength
    const randChar = chars[randIndex]
    result += randChar
  }

  return result
}
