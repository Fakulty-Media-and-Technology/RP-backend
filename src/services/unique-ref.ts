import { randomBytes } from 'node:crypto'

export const uniqueRef = (length = 12) => randomBytes(Math.round(length / 2)).toString('hex')
