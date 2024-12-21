import { LiveRepo } from '../repositories/LiveRepo'

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
