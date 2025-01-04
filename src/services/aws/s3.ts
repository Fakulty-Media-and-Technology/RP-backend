import { Upload } from '@aws-sdk/lib-storage'
import { Options } from '@aws-sdk/lib-storage/dist-types'
import { AwsUtils } from './utils'
import { DeleteObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3'

export class S3 {
  static upload = (params: Options['params']) => {
    return new Upload({ client: AwsUtils.clients.s3, params }).done()
  }

  static deleteObject = async (Key: string, Bucket = AwsUtils.buckets.reeplay) => {
    const command = new DeleteObjectCommand({ Key, Bucket })
    const res = await AwsUtils.clients.s3.send(command)
    return res
  }

  static getTranscodedKeys = async (key: string) => {
    const command = new ListObjectsCommand({
      Bucket: AwsUtils.buckets.reeplay,
      Prefix: key,
    })

    const res = await AwsUtils.clients.s3.send(command)

    if (!res.Contents) return []

    const transacodedKeys: string[] = []

    for (const content of res.Contents) {
      if (content.Key) transacodedKeys.push(content.Key)
    }

    return transacodedKeys
  }
}
