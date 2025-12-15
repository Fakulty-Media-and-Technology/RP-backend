import { createReadStream } from 'node:fs'
import crypto from 'node:crypto'

import { OperationalError } from '../utils/OperationalError'
import { S3 } from './aws/s3'
import { AwsUtils } from './aws/utils'
import { rimraf } from 'rimraf'
import { MediaConvert } from './aws/mediaConvert'
import { MulterFile } from '../types'

export type UploadAndTranscodeConfig = UploadVideoInput

type UploadVideoInput = {
  file: Express.Multer.File
  expire: Date | undefined
}

export type StoreResponse = Awaited<ReturnType<typeof MediaManagement.storeImageAndSubtitle>>

export class MediaManagement {
  private static _genUniqueKey = () => crypto.randomBytes(8).toString('hex') + Date.now()

  private static _deleteFile = async (file: MulterFile) => {
    if (file.path == null) return

    try {
      await rimraf(file.path)
    } catch {
      console.error('🛑 error deleting ', +file.filename, 'after upload')
    }
  }

  static uploadAndInitiateMediaConvert = async (
    file: MulterFile,
    expire?: Date,
    transcoder = MediaConvert.transcode,
  ) => {
    const upload = await this._storeObjectFile(file, AwsUtils.buckets.reeplay, expire)
    await transcoder(upload.Key)

    return {
      ...upload,
      isTranscoded: false,
    }
  }

  protected static _storeObjectFile = async (file: MulterFile, bucket: string, expire?: Date) => {
    try {
      const { Key, Bucket, $metadata } = await S3.upload({
        Body: file.path ? createReadStream(file.path) : file.buffer,
        Bucket: bucket,
        Key: this._genUniqueKey(),
        ContentType: file.mimetype,
        Expires: expire,
      })

      if ($metadata.httpStatusCode !== 200 || !Key || !Bucket) {
        throw new OperationalError('Upload failed. Please try again', 500)
      }

      return {
        Bucket,
        Key,
        mimetype: file.mimetype,
        size: file.size,
      }
    } catch (e) {
      throw e
    } finally {
      this._deleteFile(file)
    }
  }

  // static storeSubtitle = async (file: MulterFile, expire?: Date) => {
  //   return await this._storeObjectFile(file, AwsUtils.buckets.replayImages, expire)
  // }

  static storeImageAndSubtitle = async (file: MulterFile, expire?: Date) => {
    return await this._storeObjectFile(file, AwsUtils.buckets.replayImages, expire)
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
