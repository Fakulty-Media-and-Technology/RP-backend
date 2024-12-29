import {
  CreateJobCommand,
  CreateJobCommandInput,
  GetJobCommand,
} from '@aws-sdk/client-mediaconvert'

import { AwsUtils } from './utils'
import env from '../../env'
import { OperationalError } from '../../utils/OperationalError'

const delay = (timeMS: number) => new Promise(res => setTimeout(res, timeMS))

export class MediaConvert {
  static waitForJobCompletion = async (jobId: string) => {
    while (true) {
      const command = new GetJobCommand({
        Id: jobId,
      })

      const response = await AwsUtils.clients.mediaConvert.send(command)

      if (!response.Job) {
        throw new OperationalError('invalid job id', 404)
      }

      if (response.Job.JobPercentComplete == null) {
        return false
      }

      if (response.Job.JobPercentComplete === 100) {
        return true
      }

      await delay(1000)
    }
  }

  static transcode = async (key: string) => {
    const params: CreateJobCommandInput = {
      Role: env.IAM_ROLE_ARN,
      Settings: {
        Inputs: [
          {
            FileInput: `${AwsUtils.buckets.s3Input}/${key}`,
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
                Destination: AwsUtils.buckets.transcodeOutput + key,
              },
            },
          },
        ],
      },
    }

    return await AwsUtils.clients.mediaConvert.send(new CreateJobCommand(params))
  }
}
