import moment from 'moment'
import {
  CreateJobCommand,
  CreateJobCommandInput,
  GetJobCommand,
  ListJobsCommand,
} from '@aws-sdk/client-mediaconvert'

import { AwsUtils } from './utils'
import env from '../../env'

export const delay = (timeMS: number) => new Promise(res => setTimeout(res, timeMS))

export class MediaConvert {
  private static _extractKey = (pathLike: string) => pathLike.replace('s3://reeplay/', '')

  static listJobsLocs = async () => {
    const command = new ListJobsCommand({
      Order: 'DESCENDING',
      MaxResults: 20,
      Status: 'COMPLETE',
    })

    const response = await AwsUtils.clients.mediaConvert.send(command)

    if (!response.Jobs) {
      return []
    }

    // aws will return these jobs for 90 days even though the objects have been deleted
    // Authored_At:1/4/2025
    const excludedJobs = ['1735484351683-otuk1u', '1735483585630-grzpv2']

    const keys: Array<{ inputKey: string; outputKey: string }> = []

    for (const { Settings, Id } of response.Jobs) {
      if (Id && excludedJobs.includes(Id)) continue

      if (!Settings || !Settings.Inputs || !Settings.OutputGroups) continue

      const fileInput = Settings.Inputs[0].FileInput

      const fileOutput =
        Settings.OutputGroups[0].OutputGroupSettings?.FileGroupSettings?.Destination

      if (!fileInput || !fileOutput) continue

      keys.push({
        inputKey: this._extractKey(fileInput),
        outputKey: this._extractKey(fileOutput),
      })
    }

    return keys
  }

  static waitForJobCompletion = async (jobId: string, maxWaitTimeMins = 1) => {
    const later = moment(new Date()).add(maxWaitTimeMins, 'm').toDate()

    let isCompleted = false

    while (later > new Date()) {
      const command = new GetJobCommand({
        Id: jobId,
      })

      const response = await AwsUtils.clients.mediaConvert.send(command)

      if (response.Job === undefined) {
        break
      }

      if (response.Job.Status === 'ERROR') {
        console.dir({ '🛑error': response.Job }, { depth: null })
        break
      }

      if (response.Job.Status === 'COMPLETE') {
        isCompleted = true
        break
      }

      await delay(3000)
    }

    return isCompleted
  }

  static transcode = async (key: string) => {
    const FileInput = AwsUtils.buckets.s3Input + key
    const Destination = AwsUtils.buckets.transcodeOutput + key.replace('videos/', '')

    const params: CreateJobCommandInput = {
      Role: env.IAM_ROLE_ARN,
      Settings: {
        Inputs: [
          {
            FileInput,
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
                Destination,
              },
            },
          },
        ],
      },
    }

    const result = await AwsUtils.clients.mediaConvert.send(new CreateJobCommand(params))

    return {
      ...result,
      Key: this._extractKey(Destination),
    }
  }
}
