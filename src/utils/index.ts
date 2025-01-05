import { S3 } from '../services/aws/s3'

type SetResolutionUrlsInput = {
  key: string
  isTranscoded: boolean
  resolutionUrls: any[]
}

export const isTranscodedKey = (key: string) => key.startsWith('transcode')

export const setResolutionUrls = async (obj: SetResolutionUrlsInput) => {
  if (isTranscodedKey(obj.key)) {
    const urlsWithRes = await S3.getTranscodedUrlsWithResolution(obj.key)
    obj.resolutionUrls = urlsWithRes as any
    obj.isTranscoded = true
  }
}
