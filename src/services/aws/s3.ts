import { Upload } from '@aws-sdk/lib-storage'
import { Options } from '@aws-sdk/lib-storage/dist-types'
import { AwsUtils } from './utils'
import { DeleteObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3'
import { VideoUploadSchema } from '../../models/videoupload.model'

export class S3 {
  static upload = (params: Options['params']) => {
    return new Upload({ client: AwsUtils.clients.s3, params }).done()
  }

  static deleteObject = async (Key: string, Bucket = AwsUtils.buckets.reeplay) => {
    const command = new DeleteObjectCommand({ Key, Bucket })
    const res = await AwsUtils.clients.s3.send(command)
    return res
  }

  static getTranscodedKeysFromInputKey = async (inputKey: string) => {
    const command = new ListObjectsCommand({
      Bucket: AwsUtils.buckets.reeplay,
      Prefix: 'transcode/' + inputKey,
    })

    const { Contents } = await AwsUtils.clients.s3.send(command)

    if (Contents == null || Contents.length === 0) {
      return []
    }

    const outputKeys = Contents.reduce<string[]>((acc, content) => {
      content.Key ? acc.push(content.Key) : acc
      return acc
    }, [])

    return outputKeys
  }

  static setResolutionsPairs = async (inputKey: string) => {
    const keys = await this.getTranscodedKeysFromInputKey(inputKey)

    const pairs = keys.map(key => {
      let resolution: VideoUploadSchema['resolutions'][number]['resolution'] = '720'

      switch (true) {
        case key.includes('_1080p'):
          resolution = '1080'
          break
        case key.includes('_480p'):
          resolution = '480'
          break
        default:
          resolution = '720'
          break
      }

      return { key, resolution }
    })

    return pairs
  }
}
