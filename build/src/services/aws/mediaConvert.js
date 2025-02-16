"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaConvert = exports.delay = void 0;
const moment_1 = __importDefault(require("moment"));
const client_mediaconvert_1 = require("@aws-sdk/client-mediaconvert");
const utils_1 = require("./utils");
const env_1 = __importDefault(require("../../env"));
const delay = (timeMS) => new Promise(res => setTimeout(res, timeMS));
exports.delay = delay;
class MediaConvert {
}
exports.MediaConvert = MediaConvert;
_a = MediaConvert;
MediaConvert._extractKey = (pathLike) => pathLike.replace('s3://reeplay/', '');
MediaConvert.recentCompletedJobsKeyPairs = async () => {
    const command = new client_mediaconvert_1.ListJobsCommand({
        Order: 'DESCENDING',
        Status: 'COMPLETE',
    });
    const response = await utils_1.AwsUtils.clients.mediaConvert.send(command);
    if (!response.Jobs) {
        return [];
    }
    const keys = [];
    for (const { Settings, Id } of response.Jobs) {
        if (!Settings || !Settings.Inputs || !Settings.OutputGroups)
            continue;
        const fileInput = Settings.Inputs[0].FileInput;
        const fileOutput = Settings.OutputGroups[0].OutputGroupSettings?.FileGroupSettings?.Destination;
        if (!fileInput || !fileOutput)
            continue;
        keys.push({
            inputKey: _a._extractKey(fileInput),
            outputKey: _a._extractKey(fileOutput),
        });
    }
    return keys;
};
MediaConvert.waitForJobCompletion = async (jobId, maxWaitTimeMins = 1) => {
    let isCompleted = false;
    if (typeof jobId !== 'string')
        return isCompleted;
    const later = (0, moment_1.default)(new Date()).add(maxWaitTimeMins, 'm').toDate();
    while (later > new Date()) {
        const command = new client_mediaconvert_1.GetJobCommand({
            Id: jobId,
        });
        const response = await utils_1.AwsUtils.clients.mediaConvert.send(command);
        if (response.Job === undefined) {
            break;
        }
        if (response.Job.Status === 'ERROR') {
            console.error({
                '🛑MediaConver.waitForJobCompletion_error': {
                    CreatedAt: response.Job.CreatedAt,
                    ErrorCode: response.Job.ErrorCode,
                    ErrorMessage: response.Job.ErrorMessage,
                    inputKey: response.Job.Settings?.Inputs && response.Job.Settings.Inputs[0].FileInput,
                },
            });
            break;
        }
        if (response.Job.Status === 'COMPLETE') {
            isCompleted = true;
            break;
        }
        await (0, exports.delay)(3000);
    }
    return isCompleted;
};
MediaConvert.transcode = async (key) => {
    const FileInput = utils_1.AwsUtils.buckets.s3Input + key;
    const Destination = utils_1.AwsUtils.buckets.transcodeOutput + key.replace('videos/', '');
    const params = {
        Role: env_1.default.IAM_ROLE_ARN,
        Settings: {
            Inputs: [
                {
                    FileInput,
                    // allows videos without audio to be converted
                    AudioSelectors: {
                        'Audio Selector 1': {
                            DefaultSelection: 'DEFAULT',
                        },
                    },
                    // this does not allow videos without audio to be converted
                    // AudioSelectors: {
                    //   'Audio Selector 1': {
                    //     SelectorType: 'TRACK',
                    //     Tracks: [1],
                    //   },
                    // },
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
    };
    const job = await utils_1.AwsUtils.clients.mediaConvert.send(new client_mediaconvert_1.CreateJobCommand(params));
    return job;
};
