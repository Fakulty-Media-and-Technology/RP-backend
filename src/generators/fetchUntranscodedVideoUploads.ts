import { VideoUploadModel } from '../models/videoupload.model'

export async function* fetchUntranscodedVideoUploadDocumentsGenerator() {
  const limit = 10
  let skip = 0

  while (true) {
    try {
      const videoUploadDocuments = await VideoUploadModel.find({ isTranscoded: false })
        .skip(skip)
        .limit(limit)
        .sort({
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
