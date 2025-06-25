import { createReadStream } from 'node:fs'
import { PassThrough } from 'node:stream'
import crypto from 'node:crypto'

import { OperationalError } from '../utils/OperationalError'
import { S3 } from './aws/s3'
import { AwsUtils } from './aws/utils'
import { Bytes } from '../utils/Bytes'
import { rimraf } from 'rimraf'
import { MediaConvert } from './aws/mediaConvert'

export type UploadAndTranscodeConfig = UploadVideoInput

type UploadVideoInput = {
  file: Express.Multer.File
  expire: Date | undefined
}

type StoreConfig = {
  file: Express.Multer.File
  expire: Date | undefined
  baseDir: 'images' | 'videos' | 'subtitles'
}

export class MediaManagement {
  private static _genUniqueKey = () => Date.now() + '-' + crypto.randomBytes(5).toString('hex')

  private static _deleteFile = async (file: Express.Multer.File) => {
    if (file.path == null) return

    try {
      await rimraf(file.path)
    } catch {
      console.error('🛑 error deleting ', +file.filename, 'after upload')
    }
  }

  static uploadAndInitiateMediaConvert = async ({ file, expire }: UploadAndTranscodeConfig) => {
    const videoUpload = await this.store({
      file,
      expire: typeof expire === 'string' ? new Date(expire) : undefined,
      baseDir: 'videos',
    })

    await MediaConvert.transcode(videoUpload.Key)

    return {
      ...videoUpload,
      isTranscoded: false,
    }
  }

  static store = async ({ file, expire, baseDir }: StoreConfig) => {
    let Body: Buffer | PassThrough

    if (file.buffer) {
      Body = file.buffer
    } else if (file.path) {
      const passThrough = new PassThrough()
      createReadStream(file.path, { highWaterMark: Bytes.mb(100) }).pipe(passThrough)
      Body = passThrough
    } else {
      throw new OperationalError('file is improperly formatted', 500)
    }

    const { Key, Bucket, $metadata } = await S3.upload({
      Body,
      Bucket: AwsUtils.buckets.reeplay,
      Key: `${baseDir}/${this._genUniqueKey()}`,
      ContentType: file.mimetype,
      Expires: expire,
    })

    this._deleteFile(file)

    if ($metadata.httpStatusCode !== 200 || !Key || !Bucket) {
      throw new OperationalError('could not upload video. Please try again', 500)
    }

    return {
      Bucket,
      Key,
      mimetype: file.mimetype,
      size: file.size,
    }
  }

  static deleteObject = async (key: string, bucket: string) => {
    try {
      const response = await S3.deleteObject(key, bucket)
      return response.$metadata.httpStatusCode === 200
    } catch (e: any) {
      console.error(`🛑🛑 S3 Object delete error. KEY: ${key} | BUCKET: ${bucket}`)
      console.error('Reason', e.message || e)
      return false
    }
  }
}
