import moment from 'moment'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl as getPresignedURL } from '@aws-sdk/s3-request-presigner'
import { getSignedUrl as getCFSignedUrl } from '@aws-sdk/cloudfront-signer'
import { AwsUtils } from './aws/utils'
import env from '../env'

export class MediaAccess {
  static getSubtitleURL = async (Key: string) => {
    const command = new GetObjectCommand({ Bucket: AwsUtils.buckets.reeplay, Key })

    const URL = await getPresignedURL(AwsUtils.clients.s3, command, {
      expiresIn: 250900,
    })

    return URL
  }

  static getImageURL = (key: string) => `${env.CDN_IMAGES_BASE_URL}/${key}`

  static getSignedVideoURL = (key: string) => {
    const privateKey = env.CFS_PRIVATE_KEY.replace(/\\n/g, '\n')

    const URL = getCFSignedUrl({
      url: env.CFSDISTRIBUTION + '/' + key,
      keyPairId: env.KEY_PAIR_ID,
      dateLessThan: moment().add(1, 'days').toISOString(),
      privateKey,
    })

    return URL
  }
}
