import { LiveModel } from '../models/lives.model'
import { LiveRepo } from '../repositories/LiveRepo'
import { OperationalError } from './OperationalError'
import { genRandUniqId } from './strGen'

export const fetchValidStreamKeys = async () => {
  try {
    const keys = await LiveRepo.getActiveStreamKeys()

    if (keys.length === 0) {
      throw new Error('no active stream key')
    }

    return keys
  } catch (error) {
    console.error('Error fetching stream keys:', error)
    return null
  }
}

export const getUniqueStreamID = async (triesCount = 1): Promise<string> => {
  if (triesCount >= 5) {
    throw new OperationalError('Please try again', 500)
  }

  const streamId = genRandUniqId(12)

  const streamIdExist = await LiveModel.findOne({
    stream_key: streamId,
  })

  if (streamIdExist) {
    return await getUniqueStreamID(++triesCount)
  }

  return streamId
}
