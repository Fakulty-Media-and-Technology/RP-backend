import moment from 'moment'
import { getSignedUrl as getCFSignedUrl } from '@aws-sdk/cloudfront-signer'
import env from '../env'

export class MediaAccess {
  static getImageAndSubtitleURL = (key: string) => `${env.CDN_IMAGES_BASE_URL}/${key}`

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
