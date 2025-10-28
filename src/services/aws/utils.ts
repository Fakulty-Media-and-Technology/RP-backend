import { MediaConvertClient } from '@aws-sdk/client-mediaconvert'
import { S3Client } from '@aws-sdk/client-s3'
import env from '../../env'

const s3ClientsConfig = {
  region: env.S3REGION,
  credentials: {
    accessKeyId: env.S3ACCESS_KEY,
    secretAccessKey: env.S3SECRET_KEY,
  },
}

export class AwsUtils {
  static clients = {
    s3: new S3Client(s3ClientsConfig),
    mediaConvert: new MediaConvertClient(s3ClientsConfig),
  }

  static buckets = {
    reeplay: env.S3_VIDEO_BUCKET,
    replayImages: env.S3_IMAGE_BUCKET,

    get s3Input() {
      return `s3://${this.reeplay}/`
    },

    get transcodeOutput() {
      return `s3://${this.reeplay}/transcode/`
    },
  }
}
