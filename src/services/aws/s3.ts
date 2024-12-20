import { Upload } from '@aws-sdk/lib-storage'
import { Options } from '@aws-sdk/lib-storage/dist-types'
import { AwsUtils } from './utils'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export class S3 {
  static upload = (params: Options['params']) => {
    return new Upload({ client: AwsUtils.clients.s3, params }).done()
  }

  static deleteObject = async (key: string) => {
    const command = new DeleteObjectCommand({
      Key: key,
      Bucket: AwsUtils.buckets.s3Input,
    })

    const res = await AwsUtils.clients.s3.send(command)
    return res
  }
}
