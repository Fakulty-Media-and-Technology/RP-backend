import { createReadStream } from 'fs'
import { PassThrough } from 'stream'

import { OperationalError } from '../utils/OperationalError'
import { S3 } from './aws/s3'
import { AwsUtils } from './aws/utils'
import { Bytes } from '../utils/Bytes'
import { UploadImageOrSubtitleType } from './core/AdminManagemediaService'

type UploadImageOrSubtitle = {
  type: UploadImageOrSubtitleType
  file: Express.Multer.File
  fileName?: string
}

const fileExtensionReg = /.[a-zA-Z0-9]+$/

const slugify = (val: string, slug = '-') =>
  val
    .trim()
    .toLowerCase()
    .replace(fileExtensionReg, '')
    .replace(' ', slug)
    .replace('_', slug)
    .replace('.', slug)

const getFileName = (file: Express.Multer.File, fileName?: string) => {
  return fileName ? slugify(fileName) : slugify(file.filename)
}

const getUniqueKey = (file: Express.Multer.File, fileName?: string) => {
  return Date.now() + '-' + getFileName(file, fileName)
}

export class MediaManagement {
  static uploadVideo = async (
    file: Express.Multer.File,
    expireAt: Date | undefined,
    fileName?: string,
  ) => {
    const passThroughStream = new PassThrough()

    createReadStream(file.path, { highWaterMark: Bytes.mb(200) }).pipe(passThroughStream)

    // https://github.com/aws/aws-sdk-js-v3/blob/main/lib/lib-storage/example-code/upload-unknown-length.ts
    const uploadRes = await S3.upload({
      Body: passThroughStream,
      Bucket: AwsUtils.buckets.reeplay,
      Key: `videos/${getUniqueKey(file, fileName)}`,
      ContentType: file.mimetype,
      Expires: expireAt,
    })

    if (uploadRes.$metadata.httpStatusCode !== 200 || !uploadRes.Key) {
      throw new OperationalError('could not upload video. Please try again', 500)
    }

    return {
      Bucket: uploadRes.Bucket,
      Key: uploadRes.Key,
      mimetype: file.mimetype,
      size: file.size,
    }
  }

  static uploadImageOrSubtitle = async ({ type, file, fileName }: UploadImageOrSubtitle) => {
    const dir = type === 'image' ? 'photos' : 'subtitles'

    const response = await S3.upload({
      Bucket: AwsUtils.buckets.reeplay,
      Body: file.buffer,
      Key: `${dir}/${getUniqueKey(file, fileName)}`,
      ContentType: file.mimetype,
    })

    return {
      Bucket: response.Bucket,
      Key: response.Key,
      mimetype: file.mimetype,
    }
  }

  static deleteObject = async (key: string, bucket: string) => {
    const response = await S3.deleteObject(key, bucket)
    const deleted = response.$metadata.httpStatusCode === 200

    if (!deleted) {
      console.error(`🛑🛑 S3 Object delete error. KEY: ${key} | BUCKET: ${bucket}`)
    }

    return deleted
  }
}
