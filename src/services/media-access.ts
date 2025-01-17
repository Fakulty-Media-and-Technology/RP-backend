import moment from 'moment'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getSignedUrl as getCFSignedUrl } from '@aws-sdk/cloudfront-signer'
import { AwsUtils } from './aws/utils'
import env from '../env'
import { VideoUpload } from '../models/videoupload.model'

type KeyType = 'video' | 'photo'

export class MediaAccess {
  static getSignedUrl = async (Bucket: string, Key: string, type: KeyType) => {
    const options = { expiresIn: type === 'video' ? 36000 : 259200 }
    const command = new GetObjectCommand({ Bucket, Key })
    return await getSignedUrl(AwsUtils.clients.s3, command, options)
  }

  static getCloudFrontSignedUrl = (key: string) => {
    const privateKey = env.CFS_PRIVATE_KEY.replace(/\\n/g, '\n')

    return getCFSignedUrl({
      url: env.CFSDISTRIBUTION + '/' + key,
      keyPairId: env.KEY_PAIR_ID,
      dateLessThan: moment().add(3, 'days').toISOString(),
      privateKey,
    })
  }
}
