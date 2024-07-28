const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
     MediaConvertClient,
     CreateJobCommand,
     DescribeEndpointsCommand,
} = require("@aws-sdk/client-mediaconvert");

exports.readPhotos = async (bucket, key) => {
     try {
          const client = new S3Client({
               region: process.env.S3REGION,
               credentials: {
                    accessKeyId: process.env.S3ACCESS_KEY,
                    secretAccessKey: process.env.S3SECRET_KEY,
               },
          });

          const params = {
               Bucket: bucket,
               Expires: 259200, //3*24*60*60
               Key: key,
          };

          const command = new GetObjectCommand(params);

          const signed = await getSignedUrl(client, command);

          return signed;
     } catch (error) {
          return {
               status: 400,
               message: error.message,
          };
     }
};

exports.getVideoUrl = async (bucket, key) => {
     try {
          const client = new S3Client({
               region: process.env.S3REGION,
               credentials: {
                    accessKeyId: process.env.S3ACCESS_KEY,
                    secretAccessKey: process.env.S3SECRET_KEY,
               },
          });

          const params = {
               Bucket: bucket,
               Expires: 36000,
               Key: key,
          };

          const command = new GetObjectCommand(params);

          const signed = await getSignedUrl(client, command);

          return signed;
     } catch (error) {
          return {
               status: 400,
               message: error.message,
          };
     }
};

const client = new MediaConvertClient({
     region: process.env.S3REGION,
     credentials: {
          accessKeyId: process.env.S3ACCESS_KEY,
          secretAccessKey: process.env.S3SECRET_KEY,
     },
});

async function getAccountEndpoint() {
     try {
          const command = new DescribeEndpointsCommand({});
          const response = await client.send(command);
          if (response.Endpoints && response.Endpoints.length > 0) {
               const endpointUrl = response.Endpoints[0].Url;
               console.log(
                    "MediaConvert account-specific endpoint:",
                    endpointUrl
               );
               return endpointUrl;
          } else {
               console.error("No endpoints found.");
          }
     } catch (error) {
          console.error("Error retrieving endpoint:", error);
     }
}

exports.createTranscodingJob = async (sourcePath, transPath) => {
     try {
          const endpoint = await getAccountEndpoint();
          const emcClient = new MediaConvertClient({
               endpoint: endpoint,
               region: process.env.S3REGION,
               credentials: {
                    accessKeyId: process.env.S3ACCESS_KEY,
                    secretAccessKey: process.env.S3SECRET_KEY,
               },
          });

          const videoId = Date.now();
          const outputPath = `${transPath}/`;

          const params = {
               Role: process.env.IAM_ROLE_ARN,
               Settings: {
                    Inputs: [
                         {
                              FileInput: sourcePath,
                              AudioSelectors: {
                                   "Audio Selector 1": {
                                        SelectorType: "TRACK",
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
                              Name: "File Group",
                              Outputs: [
                                   {
                                        ContainerSettings: {
                                             Container: "MP4",
                                        },
                                        VideoDescription: {
                                             CodecSettings: {
                                                  Codec: "H_264",
                                                  H264Settings: {
                                                       Bitrate: 1500000,
                                                       RateControlMode: "CBR",
                                                       CodecProfile: "MAIN",
                                                       CodecLevel: "AUTO",
                                                       InterlaceMode:
                                                            "PROGRESSIVE",
                                                       FramerateControl:
                                                            "INITIALIZE_FROM_SOURCE",
                                                       GopSize: 90,
                                                       GopSizeUnits: "FRAMES",
                                                       GopClosedCadence: 1,
                                                       NumberBFramesBetweenReferenceFrames: 2,
                                                       NumberReferenceFrames: 3,
                                                  },
                                             },
                                             Height: 480,
                                             Width: 640,
                                             ScalingBehavior: "DEFAULT",
                                             Sharpness: 50,
                                        },
                                        AudioDescriptions: [
                                             {
                                                  CodecSettings: {
                                                       Codec: "AAC",
                                                       AacSettings: {
                                                            Bitrate: 96000,
                                                            CodingMode:
                                                                 "CODING_MODE_2_0",
                                                            SampleRate: 48000,
                                                       },
                                                  },
                                                  LanguageCodeControl:
                                                       "FOLLOW_INPUT",
                                             },
                                        ],
                                        NameModifier: "_480p",
                                   },
                                   {
                                        ContainerSettings: {
                                             Container: "MP4",
                                        },
                                        VideoDescription: {
                                             CodecSettings: {
                                                  Codec: "H_264",
                                                  H264Settings: {
                                                       Bitrate: 4500000,
                                                       RateControlMode: "CBR",
                                                       CodecProfile: "MAIN",
                                                       CodecLevel: "AUTO",
                                                       InterlaceMode:
                                                            "PROGRESSIVE",
                                                       FramerateControl:
                                                            "INITIALIZE_FROM_SOURCE",
                                                       GopSize: 90,
                                                       GopSizeUnits: "FRAMES",
                                                       GopClosedCadence: 1,
                                                       NumberBFramesBetweenReferenceFrames: 2,
                                                       NumberReferenceFrames: 3,
                                                  },
                                             },
                                             Height: 720,
                                             Width: 1280,
                                             ScalingBehavior: "DEFAULT",
                                             Sharpness: 50,
                                        },
                                        AudioDescriptions: [
                                             {
                                                  CodecSettings: {
                                                       Codec: "AAC",
                                                       AacSettings: {
                                                            Bitrate: 96000,
                                                            CodingMode:
                                                                 "CODING_MODE_2_0",
                                                            SampleRate: 48000,
                                                       },
                                                  },
                                                  LanguageCodeControl:
                                                       "FOLLOW_INPUT",
                                             },
                                        ],
                                        NameModifier: "_720p",
                                   },
                                   {
                                        ContainerSettings: {
                                             Container: "MP4",
                                        },
                                        VideoDescription: {
                                             CodecSettings: {
                                                  Codec: "H_264",
                                                  H264Settings: {
                                                       Bitrate: 6000000,
                                                       RateControlMode: "CBR",
                                                       CodecProfile: "MAIN",
                                                       CodecLevel: "AUTO",
                                                       InterlaceMode:
                                                            "PROGRESSIVE",
                                                       FramerateControl:
                                                            "INITIALIZE_FROM_SOURCE",
                                                       GopSize: 90,
                                                       GopSizeUnits: "FRAMES",
                                                       GopClosedCadence: 1,
                                                       NumberBFramesBetweenReferenceFrames: 2,
                                                       NumberReferenceFrames: 3,
                                                  },
                                             },
                                             Height: 1080,
                                             Width: 1920,
                                             ScalingBehavior: "DEFAULT",
                                             Sharpness: 50,
                                        },
                                        AudioDescriptions: [
                                             {
                                                  CodecSettings: {
                                                       Codec: "AAC",
                                                       AacSettings: {
                                                            Bitrate: 96000,
                                                            CodingMode:
                                                                 "CODING_MODE_2_0",
                                                            SampleRate: 48000,
                                                       },
                                                  },
                                                  LanguageCodeControl:
                                                       "FOLLOW_INPUT",
                                             },
                                        ],
                                        NameModifier: "_1080p",
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
                                   Type: "FILE_GROUP_SETTINGS",
                                   FileGroupSettings: {
                                        Destination: outputPath,
                                   },
                              },
                         },
                    ],
               },
          };

          const data = await emcClient.send(new CreateJobCommand(params));
          console.log("Transcoding Job Created!");
          return data;
     } catch (error) {
          console.log("Error message", error.message);
          return error.message;
     }
};
