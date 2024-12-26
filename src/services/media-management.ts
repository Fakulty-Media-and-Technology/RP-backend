import { createReadStream } from 'fs'
import { PassThrough } from 'stream'
import { randomUUID } from 'crypto'

import { OperationalError } from '../utils/OperationalError'
import { S3 } from './aws/s3'
import { AwsUtils } from './aws/utils'
import { Bytes } from '../utils/Bytes'
import { MediaConvert } from './aws/mediaConvert'

export class MediaManagement {
  static uploadVideo = async (file: Express.Multer.File, expireAt?: Date) => {
    const passThroughStream = new PassThrough()

    createReadStream(file.path, { highWaterMark: Bytes.mb(100) }).pipe(passThroughStream)

    // https://github.com/aws/aws-sdk-js-v3/blob/main/lib/lib-storage/example-code/upload-unknown-length.ts
    const uploadRes = await S3.upload({
      Body: passThroughStream,
      Bucket: AwsUtils.buckets.s3Input,
      Key: `videos/${file.filename}-${new Date().getTime()}-${randomUUID()}`,
      ContentType: file.mimetype,
      Expires: expireAt,
    })

    if (uploadRes.$metadata.httpStatusCode !== 200 || !uploadRes.Key) {
      throw new OperationalError('could not upload video. Please try again', 500)
    }

    const transcodeRes = await MediaConvert.transcode(uploadRes.Key)

    return {
      s3_res: uploadRes,
      Bucket: uploadRes.Bucket,
      Key: uploadRes.Key,
      transcodeRes,
    }
  }

  static uploadSubtitle = async (file: Express.Multer.File) => {
    const response = await S3.upload({
      Bucket: AwsUtils.buckets.s3Input,
      Body: file.buffer,
      Key: `subtitles/${file.filename}-${new Date().getTime()}-${randomUUID()}`,
      ContentType: file.mimetype,
    })

    return {
      uploadRes: response,
      Bucket: response.Bucket,
      Key: response.Key,
    }
  }

  static uploadImage = async (file: Express.Multer.File) => {
    const response = await S3.upload({
      Bucket: AwsUtils.buckets.s3Input,
      Body: file.buffer,
      Key: `photos/${file.filename}-${new Date().getTime()}-${randomUUID()}`,
      ContentType: file.mimetype,
    })

    return {
      uploadRes: response,
      Bucket: response.Bucket,
      Key: response.Key,
    }
  }

  static deletePhoto = async (key: string) => {
    const response = await S3.deleteObject(key)

    if (!response.$metadata.httpStatusCode || response.$metadata.httpStatusCode > 299) {
      throw new OperationalError('Error deleting photo', 500)
    }

    return true
  }
}
