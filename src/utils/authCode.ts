export const authCode = (digit: number) => {
  let pin = ''

  for (let i = 0; i < digit; i++) {
    const num = Math.floor(Math.random() * 10)
    pin += num
  }

  return pin
}
