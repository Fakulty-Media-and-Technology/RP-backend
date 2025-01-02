import env from '../env'
import { LiveModel } from '../models/lives.model'
import { OperationalError } from './OperationalError'
import { genRandUniqId } from './strGen'

export const getUniqueStreamKey = async (triesCount = 1): Promise<string> => {
  if (triesCount >= 5) {
    throw new OperationalError('Please try again', 500)
  }

  const streamId = genRandUniqId(12)

  const streamIdExist = await LiveModel.findOne({
    stream_key: streamId,
  })

  if (streamIdExist) {
    return await getUniqueStreamKey(++triesCount)
  }

  return streamId
}

export const calcLiveCharges = (start: string, expiry: string) => {
  const startDate = new Date(start).getTime()
  const expiryDate = new Date(expiry).getTime()
  const hoursDifference = (expiryDate - startDate) / (60 * 60000)
  return hoursDifference * env.EVENT_HOURLY_CHARGES
}
