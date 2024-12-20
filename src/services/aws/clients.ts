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

export class AWSClients {
  static s3 = new S3Client(s3ClientsConfig)
  static mediaConvert = new MediaConvertClient(s3ClientsConfig)
}
