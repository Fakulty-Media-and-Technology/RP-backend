import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { AwsUtils } from './aws/utils'

type URL = 'video' | 'photo'

export class MediaAccess {
  static getSignedUrl = async (Bucket: string, Key: string, type: URL) => {
    const options = { expiresIn: type === 'video' ? 36000 : 259200 }
    const command = new GetObjectCommand({ Bucket, Key })
    return await getSignedUrl(AwsUtils.clients.s3, command, options)
  }

  static getTranscodedSignedUrls = async (
    Bucket: string,
    objs: { resolution: string; key: string }[],
  ) => {
    return await Promise.all(
      objs.map(async obj => ({
        resolution: obj.resolution,
        key: await this.getSignedUrl(Bucket, obj.key, 'video'),
      })),
    )
  }
}
