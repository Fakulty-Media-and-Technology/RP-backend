import { LiveRepo } from '../repositories/LiveRepo'

export async function* liveEvents24hReminderGenerator({ batchSize = 200 }: { batchSize?: number }) {
  let skip = 0

  while (true) {
    try {
      const batch = await LiveRepo.get24hReminderDocuments(skip, batchSize)

      if (!batch.length) {
        break
      }

      yield batch

      skip += batchSize
    } catch (e) {
      console.error('liveEvents24hReminderGenerator', e)
      break
    }
  }
}
