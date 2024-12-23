import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { MediaConvertClient } from '@aws-sdk/client-mediaconvert'

import env from '../env'

const s3ClientsConfig = {
  region: env.S3REGION,
  credentials: {
    accessKeyId: env.S3ACCESS_KEY,
    secretAccessKey: env.S3SECRET_KEY,
  },
}

export const s3Client = new S3Client(s3ClientsConfig)
export const mediaConvertClient = new MediaConvertClient(s3ClientsConfig)

// exports.readPhotos = async (bucket: string, key: string) => {
//   const params = {
//     Bucket: bucket,
//     Expires: 259200, //3*24*60*60
//     Key: key,
//   }

//   const command = new GetObjectCommand(params)
//   const signed = await getSignedUrl(s3Client, command)
//   return signed
// }

// exports.getVideoUrl = async (bucket: string, key: string) => {
//   const params = {
//     Bucket: bucket,
//     Expires: 36000,
//     Key: key,
//   }

//   const command = new GetObjectCommand(params)
//   const signed = await getSignedUrl(s3Client, command)

//   return signed
// }

export class MediaAccess {
  static getSignedUrl = async (Bucket: string, Key: string, type: 'video' | 'photo') => {
    const expiresIn = type === 'video' ? 36000 : 259200
    const command = new GetObjectCommand({ Bucket, Key })
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return signedUrl
  }
}
