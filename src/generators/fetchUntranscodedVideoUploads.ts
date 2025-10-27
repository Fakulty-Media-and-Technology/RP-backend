import { VideoUploadRepo } from '../repositories/VideoUploadRepo'

export async function* fetchUntranscodedVideoUploadDocumentsGenerator() {
  const limit = 50
  let skip = 0

  while (true) {
    try {
      const videoUploadDocuments = await VideoUploadRepo.fetchNotTranscoded(skip, limit).sort({
        _id: 1,
      })

      if (videoUploadDocuments.length === 0) {
        break
      }

      yield videoUploadDocuments
      skip += limit
    } catch (e: any) {
      console.error('fetchUntranscodedVideoUploadDocumentsGenerator error', e.message || e)
      break
    }
  }
}
