import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { AwsUtils } from './aws/utils'

type KeyType = 'video' | 'photo'
type ResObjs = Array<{ resolution: string; key: string }>

export class MediaAccess {
  static getSignedUrl = async (Bucket: string, Key: string, type: KeyType) => {
    const options = { expiresIn: type === 'video' ? 36000 : 259200 }
    const command = new GetObjectCommand({ Bucket, Key })
    return await getSignedUrl(AwsUtils.clients.s3, command, options)
  }

  static getTranscodedLocationURLS = async (bucket: string, objs: ResObjs) => {
    const promises = objs.map(async ({ resolution, key }) => ({
      resolution,
      key: await this.getSignedUrl(bucket, key, 'video'),
    }))

    return await Promise.all(promises)
  }
}
