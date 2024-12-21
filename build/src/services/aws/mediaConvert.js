"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaConvert = void 0;
const client_mediaconvert_1 = require("@aws-sdk/client-mediaconvert");
const utils_1 = require("./utils");
const env_1 = __importDefault(require("../../env"));
const OperationalError_1 = require("../../utils/OperationalError");
const delay = (timeMS) => new Promise(res => setTimeout(res, timeMS));
class MediaConvert {
}
exports.MediaConvert = MediaConvert;
_a = MediaConvert;
MediaConvert.waitForJobCompletion = async (jobId) => {
    while (true) {
        const command = new client_mediaconvert_1.GetJobCommand({
            Id: jobId,
        });
        const response = await utils_1.AwsUtils.clients.mediaConvert.send(command);
        if (!response.Job) {
            throw new OperationalError_1.OperationalError('invalid job id', 404);
        }
        if (response.Job.JobPercentComplete == null) {
            return false;
        }
        if (response.Job.JobPercentComplete === 100) {
            return true;
        }
        await delay(1000);
    }
};
MediaConvert.transcode = async (key) => {
    const params = {
        Role: env_1.default.IAM_ROLE_ARN,
        Settings: {
            Inputs: [
                {
                    FileInput: `${utils_1.AwsUtils.buckets.s3Input}/${key}`,
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
                            Destination: `${utils_1.AwsUtils.buckets.transcodeOutput}/${key}`,
                        },
                    },
                },
            ],
        },
    };
    return await utils_1.AwsUtils.clients.mediaConvert.send(new client_mediaconvert_1.CreateJobCommand(params));
};
