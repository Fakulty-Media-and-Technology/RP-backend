import { createReadStream } from 'fs'
import { PassThrough } from 'stream'
import { randomUUID } from 'crypto'

import { OperationalError } from '../utils/OperationalError'
import { S3 } from './aws/s3'
import { AwsUtils } from './aws/utils'
import { Bytes } from '../utils/Bytes'
import { MediaConvert } from './aws/mediaConvert'

function getFileExtension(filename: string) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop() : ''
}

export class MediaManagement {
  static uploadVideo = async (file: Express.Multer.File, expireAt?: Date) => {
    if (!file.mimetype.startsWith('video')) {
      throw new OperationalError('only video file can be uploded', 400)
    }

    const passThroughStream = new PassThrough()

    createReadStream(file.path, { highWaterMark: Bytes.mb(200) }).pipe(passThroughStream)

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

  // exports.uploadLargeVideos = async (req, fileHandle, fileKey, expire, res) => {
  //   if (!req.files) return false
  //   if (!req.files[fileHandle]) return false
  //   let file = { ...req.files[fileHandle] }

  //   const bucketName = 'reeplay'
  //   const key = fileKey ? `videos/${fileKey}` : file ? `videos/${file.name}` : `videos/${Date.now()}`
  //   const buffer = file?.data

  //   let uploadId

  //   try {
  //     // Create multipart upload
  //     const multipartUpload = await s3Client.send(
  //       new CreateMultipartUploadCommand({
  //         Bucket: bucketName,
  //         Key: key,
  //         Expires: expire ? new Date(expire) : undefined,
  //         ContentType: file?.mimetype,
  //       }),
  //     )

  //     uploadId = multipartUpload.UploadId

  //     const uploadPromises = []
  //     const minPartSize = 5 * 1024 * 1024 // 5 MB
  //     const totalBytes = buffer.length
  //     let totalUploadedBytes = 0

  //     for (let start = 0, partNumber = 1; start < totalBytes; start += minPartSize, partNumber++) {
  //       const end = Math.min(start + minPartSize, totalBytes)
  //       const partBuffer = buffer.subarray(start, end)

  //       const uploadPromise = s3Client
  //         .send(
  //           new UploadPartCommand({
  //             Bucket: bucketName,
  //             Key: key,
  //             UploadId: uploadId,
  //             Body: partBuffer,
  //             PartNumber: partNumber,
  //           }),
  //         )
  //         .then(uploadResult => {
  //           totalUploadedBytes += partBuffer.length
  //           const percentage = ((totalUploadedBytes / totalBytes) * 100).toFixed(2)

  //           res.write(
  //             `data: ${JSON.stringify({
  //               status: `${percentage}%`,
  //             })}\n\n`,
  //           )

  //           console.log(`Part ${partNumber} - Uploaded: ${percentage}%`)
  //           return {
  //             ETag: uploadResult.ETag,
  //             PartNumber: partNumber,
  //           }
  //         })

  //       uploadPromises.push(uploadPromise)
  //     }

  //     const uploadResults = await Promise.all(uploadPromises)
  //     console.log('All parts uploaded successfully.')

  //     const sortedUploadResults = uploadResults.sort((a, b) => a.PartNumber - b.PartNumber)

  //     const completeResponse = await s3Client.send(
  //       new CompleteMultipartUploadCommand({
  //         Bucket: bucketName,
  //         Key: key,
  //         UploadId: uploadId,
  //         MultipartUpload: {
  //           Parts: sortedUploadResults.map(({ ETag, PartNumber }) => ({
  //             ETag,
  //             PartNumber,
  //           })),
  //         },
  //       }),
  //     )

  //     console.log('Multipart upload completed successfully.')
  //     res.write(
  //       `data: ${JSON.stringify({
  //         status: 'completed',
  //         data: completeResponse,
  //       })}\n\n`,
  //     )
  //     res.end()

  //     const filePath = `s3://reeplay/${key}`
  //     const transPath = `s3://reeplay/transcode/${key.split('/').slice(1).join('/')}`

  //     await createTranscodingJob(filePath, transPath)

  //     return {
  //       s3_res: completeResponse,
  //       Bucket: bucketName,
  //       Key: key,
  //     }
  //   } catch (err) {
  //     console.error('Error occurred:', err)

  //     if (uploadId) {
  //       const abortCommand = new AbortMultipartUploadCommand({
  //         Bucket: bucketName,
  //         Key: key,
  //         UploadId: uploadId,
  //       })

  //       await s3Client.send(abortCommand)
  //       console.log('Multipart upload aborted.')
  //     }
  //   }
  // }

  // exports.uploadShortVideos = async (req, fileHandle, expire, fileKey) => {
  //   if (!req.files) return false
  //   if (!req.files[fileHandle]) return false
  //   let file = { ...req.files[fileHandle] }

  //   const bucketName = 'reeplay'
  //   const key = fileKey ? `videos/${fileKey}` : file ? `videos/${file.name}` : `videos/${Date.now()}`
  //   const buffer = file?.data

  //   try {
  //     const putObjectCommand = new PutObjectCommand({
  //       Bucket: bucketName,
  //       Key: key,
  //       Body: buffer,
  //       ContentType: file?.mimetype,
  //       Expires: expire ? new Date(expire) : undefined,
  //     })

  //     const uploadResult = await s3Client.send(putObjectCommand)

  //     const filePath = `s3://reeplay/${key}`
  //     const transPath = `s3://reeplay/transcode/${key.split('/').slice(1).join('/')}`

  //     await createTranscodingJob(filePath, transPath)

  //     return {
  //       s3_res: uploadResult,
  //       Bucket: bucketName,
  //       Key: key,
  //     }
  //   } catch (err) {
  //     console.error('Error occurred while uploading:', err)
  //     throw err
  //   }
  // }

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

