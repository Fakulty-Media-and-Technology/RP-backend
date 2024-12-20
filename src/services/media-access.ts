import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  MediaConvertClient,
  CreateJobCommand,
  CreateJobCommandInput,
} from '@aws-sdk/client-mediaconvert'

import env from '../env'

const s3ClientsConfig = {
  region: env.S3REGION,
  credentials: {
    accessKeyId: env.S3ACCESS_KEY,
    secretAccessKey: env.S3SECRET_KEY,
  },
}

export const s3Client = new S3Client(s3ClientsConfig)
export const mediaConvertClient = new MediaConvertClient(s3ClientsConfig)

// exports.readPhotos = async (bucket: string, key: string) => {
//   const params = {
//     Bucket: bucket,
//     Expires: 259200, //3*24*60*60
//     Key: key,
//   }

//   const command = new GetObjectCommand(params)
//   const signed = await getSignedUrl(s3Client, command)
//   return signed
// }

// exports.getVideoUrl = async (bucket: string, key: string) => {
//   const params = {
//     Bucket: bucket,
//     Expires: 36000,
//     Key: key,
//   }

//   const command = new GetObjectCommand(params)
//   const signed = await getSignedUrl(s3Client, command)

//   return signed
// }

export class MediaAccess {
  static getSignedUrl = async (Bucket: string, Key: string) => {
    const command = new GetObjectCommand({ Bucket, Key })
    const signedUrl = await getSignedUrl(s3Client, command)
    return signedUrl
  }

  static createTranscodingJob = async (sourcePath: string, transPath: string) => {
    const videoId = Date.now()
    const outputPath = `${transPath}/`

    const params: CreateJobCommandInput = {
      Role: env.IAM_ROLE_ARN,
      Settings: {
        Inputs: [
          {
            FileInput: sourcePath,
            AudioSelectors: {
              'Audio Selector 1': {
                SelectorType: 'TRACK',
                Tracks: [1],
              },
            },
            // TimecodeSource: "ZEROBASED",
            // InputClippings: [
            //     {
            //         StartTimecode: "00:00:00:00",
            //         EndTimecode: "00:00:30:00",
            //     },
            // ],
          },
        ],
        OutputGroups: [
          {
            Name: 'File Group',
            Outputs: [
              {
                ContainerSettings: {
                  Container: 'MP4',
                },
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      Bitrate: 1500000,
                      RateControlMode: 'CBR',
                      CodecProfile: 'MAIN',
                      CodecLevel: 'AUTO',
                      InterlaceMode: 'PROGRESSIVE',
                      FramerateControl: 'INITIALIZE_FROM_SOURCE',
                      GopSize: 90,
                      GopSizeUnits: 'FRAMES',
                      GopClosedCadence: 1,
                      NumberBFramesBetweenReferenceFrames: 2,
                      NumberReferenceFrames: 3,
                    },
                  },
                  Height: 480,
                  Width: 640,
                  ScalingBehavior: 'DEFAULT',
                  Sharpness: 50,
                },
                AudioDescriptions: [
                  {
                    CodecSettings: {
                      Codec: 'AAC',
                      AacSettings: {
                        Bitrate: 96000,
                        CodingMode: 'CODING_MODE_2_0',
                        SampleRate: 48000,
                      },
                    },
                    LanguageCodeControl: 'FOLLOW_INPUT',
                  },
                ],
                NameModifier: '_480p',
              },
              {
                ContainerSettings: {
                  Container: 'MP4',
                },
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      Bitrate: 4500000,
                      RateControlMode: 'CBR',
                      CodecProfile: 'MAIN',
                      CodecLevel: 'AUTO',
                      InterlaceMode: 'PROGRESSIVE',
                      FramerateControl: 'INITIALIZE_FROM_SOURCE',
                      GopSize: 90,
                      GopSizeUnits: 'FRAMES',
                      GopClosedCadence: 1,
                      NumberBFramesBetweenReferenceFrames: 2,
                      NumberReferenceFrames: 3,
                    },
                  },
                  Height: 720,
                  Width: 1280,
                  ScalingBehavior: 'DEFAULT',
                  Sharpness: 50,
                },
                AudioDescriptions: [
                  {
                    CodecSettings: {
                      Codec: 'AAC',
                      AacSettings: {
                        Bitrate: 96000,
                        CodingMode: 'CODING_MODE_2_0',
                        SampleRate: 48000,
                      },
                    },
                    LanguageCodeControl: 'FOLLOW_INPUT',
                  },
                ],
                NameModifier: '_720p',
              },
              {
                ContainerSettings: {
                  Container: 'MP4',
                },
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      Bitrate: 6000000,
                      RateControlMode: 'CBR',
                      CodecProfile: 'MAIN',
                      CodecLevel: 'AUTO',
                      InterlaceMode: 'PROGRESSIVE',
                      FramerateControl: 'INITIALIZE_FROM_SOURCE',
                      GopSize: 90,
                      GopSizeUnits: 'FRAMES',
                      GopClosedCadence: 1,
                      NumberBFramesBetweenReferenceFrames: 2,
                      NumberReferenceFrames: 3,
                    },
                  },
                  Height: 1080,
                  Width: 1920,
                  ScalingBehavior: 'DEFAULT',
                  Sharpness: 50,
                },
                AudioDescriptions: [
                  {
                    CodecSettings: {
                      Codec: 'AAC',
                      AacSettings: {
                        Bitrate: 96000,
                        CodingMode: 'CODING_MODE_2_0',
                        SampleRate: 48000,
                      },
                    },
                    LanguageCodeControl: 'FOLLOW_INPUT',
                  },
                ],
                NameModifier: '_1080p',
              },
              // {
              //     ContainerSettings: {
              //         Container: "MP4",
              //     },
              //     VideoDescription: {
              //         CodecSettings: {
              //             Codec: "H_265",
              //             H265Settings: {
              //                 Bitrate: 10000000,
              //                 RateControlMode: "CBR",
              //                 CodecProfile: "MAIN",
              //                 CodecLevel: "AUTO",
              //                 InterlaceMode: "PROGRESSIVE",
              //                 FramerateControl:
              //                     "INITIALIZE_FROM_SOURCE",
              //                 GopSize: 90,
              //                 GopSizeUnits: "FRAMES",
              //                 GopClosedCadence: 1,
              //                 NumberBFramesBetweenReferenceFrames: 2,
              //                 NumberReferenceFrames: 3,
              //             },
              //         },
              //         Height: 2160,
              //         Width: 3840,
              //         ScalingBehavior: "DEFAULT",
              //         Sharpness: 50,
              //     },
              //     AudioDescriptions: [
              //         {
              //             CodecSettings: {
              //                 Codec: "AAC",
              //                 AacSettings: {
              //                     Bitrate: 96000,
              //                     CodingMode: "CODING_MODE_2_0",
              //                     SampleRate: 48000,
              //                 },
              //             },
              //             LanguageCodeControl: "FOLLOW_INPUT",
              //         },
              //     ],
              //     NameModifier: "_4k",
              // },
            ],
            OutputGroupSettings: {
              Type: 'FILE_GROUP_SETTINGS',
              FileGroupSettings: {
                Destination: outputPath,
              },
            },
          },
        ],
      },
    }

    const data = await mediaConvertClient.send(new CreateJobCommand(params))
    console.log('Transcoding Job Created!')
    return data
  }
}
