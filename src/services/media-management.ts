import { createReadStream } from 'node:fs'
import { PassThrough } from 'node:stream'
import crypto from 'node:crypto'

import { OperationalError } from '../utils/OperationalError'
import { S3 } from './aws/s3'
import { AwsUtils } from './aws/utils'
import { Bytes } from '../utils/Bytes'
import { rimraf } from 'rimraf'
import { MediaConvert } from './aws/mediaConvert'

type UploadImageOrSubtitle = {
  type: 'image' | 'subtitle'
  file: Express.Multer.File
}

export type UploadAndTranscodeConfig = UploadVideoInput & {
  waitTranscode: boolean
  waitDuration?: number
}

// const fileExtensionReg = /.[a-zA-Z0-9]+$/

const getUniqueKey = () => Date.now() + '-' + crypto.randomBytes(5).toString('hex')

type UploadVideoInput = {
  file: Express.Multer.File
  expire: Date | undefined
}

export class MediaManagement {
  static uploadAndTransacodeVideo = async ({
    file,
    expire,
    waitTranscode,
    waitDuration = 20,
  }: UploadAndTranscodeConfig) => {
    if (file == null) {
      throw new OperationalError('upload a video file', 400)
    }

    const video = await this.uploadVideo({
      file,
      expire: typeof expire === 'string' ? new Date(expire) : undefined,
    })

    const response = {
      ...video,
      isTranscoded: false,
    }

    if (waitTranscode) {
      const { Job } = await MediaConvert.transcode(video.Key)
      response.isTranscoded = await MediaConvert.waitForJobCompletion(Job?.Id, waitDuration)
    }

    return response
  }

  static uploadVideo = async ({ file, expire }: UploadVideoInput) => {
    let Body: Buffer | PassThrough

    if (file.path) {
      const passThroughStream = new PassThrough()
      createReadStream(file.path, { highWaterMark: Bytes.mb(200) }).pipe(passThroughStream)
      Body = passThroughStream
    } else if (file.buffer) {
      Body = file.buffer
    } else {
      throw new OperationalError('File must be a stream or buffer', 500)
    }

    // https://github.com/aws/aws-sdk-js-v3/blob/main/lib/lib-storage/example-code/upload-unknown-length.ts
    const uploadRes = await S3.upload({
      Body,
      Bucket: AwsUtils.buckets.reeplay,
      Key: `videos/${getUniqueKey()}`,
      ContentType: file.mimetype,
      Expires: expire,
    })

    if (file.path) {
      rimraf(file.path).catch(_ =>
        console.error('🛑 error deleting ', +file.filename + ' from tempMedia folder'),
      )
    }

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

  static uploadImageOrSubtitle = async ({ type, file }: UploadImageOrSubtitle) => {
    const dir = type === 'image' ? 'photos' : 'subtitles'

    const response = await S3.upload({
      Bucket: AwsUtils.buckets.reeplay,
      Body: file.buffer,
      Key: `${dir}/${getUniqueKey()}`,
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
