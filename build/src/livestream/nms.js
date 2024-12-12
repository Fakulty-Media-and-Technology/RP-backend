"use strict";
const NodeMediaServer = require('node-media-server');
const LivesModel = require('../models/lives.model');
const liveStreamAuth = require('../middlewares/ls-auth.mw');
const UsersModel = require('../models/users.model');
const { VerifytPass } = require('../utils/bcrypt');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const connect = {
    name: 'live',
    pkg: require('../../package'),
    async register() {
        const config = {
            logType: 0,
            rtmp: {
                port: 1935,
                chunk_size: 60000,
                gop_cache: true,
                ping: 30,
                ping_timeout: 60,
            },
            http: {
                port: process.env.MEDIA_SERVER_PORT || 8888,
                mediaroot: './media',
                allow_origin: '*',
            },
            auth: {
                play: true,
                publish: true,
                secret: 'nodemedia2017privatekey',
            },
            trans: {
                ffmpeg: ffmpegPath,
                tasks: [
                    {
                        app: 'live',
                        hls: true,
                        raw: [
                            '-vf',
                            'scale=w=640:h=360:force_original_aspect_ratio=decrease',
                            '-c:a',
                            'aac',
                            '-ar',
                            '48000',
                            '-c:v',
                            'libx264',
                            '-preset',
                            'veryfast',
                            '-profile:v',
                            'main',
                            '-crf',
                            '20',
                            '-sc_threshold',
                            '0',
                            '-g',
                            '48',
                            '-keyint_min',
                            '48',
                            '-hls_time',
                            '6',
                            '-hls_list_size',
                            '10',
                            '-hls_flags',
                            'delete_segments',
                            '-max_muxing_queue_size',
                            '1024',
                            '-start_number',
                            '${timeInMilliseconds}',
                            '-b:v',
                            '800k',
                            '-maxrate',
                            '856k',
                            '-bufsize',
                            '1200k',
                            '-b:a',
                            '96k',
                            '-hls_segment_filename',
                            '${mediaroot}/${streamName}/360p/%03d.ts',
                            '${mediaroot}/${streamName}/360p/index.m3u8',
                            '-vf',
                            'scale=w=842:h=480:force_original_aspect_ratio=decrease',
                            '-c:a',
                            'aac',
                            '-ar',
                            '48000',
                            '-c:v',
                            'libx264',
                            '-preset',
                            'veryfast',
                            '-profile:v',
                            'main',
                            '-crf',
                            '20',
                            '-sc_threshold',
                            '0',
                            '-g',
                            '48',
                            '-keyint_min',
                            '48',
                            '-hls_time',
                            '6',
                            '-hls_list_size',
                            '10',
                            '-hls_flags',
                            'delete_segments',
                            '-max_muxing_queue_size',
                            '1024',
                            '-start_number',
                            '${timeInMilliseconds}',
                            '-b:v',
                            '1400k',
                            '-maxrate',
                            '1498k',
                            '-bufsize',
                            '2100k',
                            '-b:a',
                            '128k',
                            '-hls_segment_filename',
                            '${mediaroot}/${streamName}/480p/%03d.ts',
                            '${mediaroot}/${streamName}/480p/index.m3u8',
                            '-vf',
                            'scale=w=1280:h=720:force_original_aspect_ratio=decrease',
                            '-c:a',
                            'aac',
                            '-ar',
                            '48000',
                            '-c:v',
                            'libx264',
                            '-preset',
                            'veryfast',
                            '-profile:v',
                            'main',
                            '-crf',
                            '20',
                            '-sc_threshold',
                            '0',
                            '-g',
                            '48',
                            '-keyint_min',
                            '48',
                            '-hls_time',
                            '6',
                            '-hls_list_size',
                            '10',
                            '-hls_flags',
                            'delete_segments',
                            '-max_muxing_queue_size',
                            '1024',
                            '-start_number',
                            '${timeInMilliseconds}',
                            '-b:v',
                            '2800k',
                            '-maxrate',
                            '2996k',
                            '-bufsize',
                            '4200k',
                            '-b:a',
                            '128k',
                            '-hls_segment_filename',
                            '${mediaroot}/${streamName}/720p/%03d.ts',
                            '${mediaroot}/${streamName}/720p/index.m3u8',
                        ],
                        ouPaths: [
                            '${mediaroot}/${streamName}/360p',
                            '${mediaroot}/${streamName}/480p',
                            '${mediaroot}/${streamName}/720p',
                        ],
                        hlsFlags: '',
                        cleanup: false,
                    },
                ],
            },
        };
        const nms = new NodeMediaServer(config);
        let validStreamKeys = [];
        const fetchStreamKeys = async () => {
            try {
                const streamKeys = await LivesModel.find({ active: true }); //, 'stream_key'
                validStreamKeys = streamKeys.map(doc => doc.stream_key);
                // console.log('Fetched stream keys:', validStreamKeys);
            }
            catch (error) {
                console.error('Error fetching stream keys:', error);
            }
        };
        fetchStreamKeys();
        // const authLiveStm = async (email, password) => {
        //      try {
        //           const userExist = await UsersModel.findOne({
        //                email: email,
        //           });
        //           if (!userExist) {
        //                return false;
        //           }
        //           if (
        //                !["channel", "tvshow", "event", "podcast"].includes(
        //                     userExist.role
        //                )
        //           ) {
        //                return false;
        //           }
        //           const passVerify = await VerifytPass(
        //                password,
        //                userExist.password
        //           );
        //           if (!passVerify) {
        //                return false;
        //           }
        //           if (userExist.suspended) {
        //                return false;
        //           }
        //           return true;
        //      } catch (error) {
        //           console.error("Error fetching stream keys:", error);
        //      }
        // };
        // nms.on("preConnect", async (id, args) => {
        //      try {
        //           const extractQueryParams = (url) => {
        //                const queryParams = {};
        //                const urlObj = new URL(
        //                     url,
        //                     `rtmp://${config.rtmp.port}`
        //                );
        //                urlObj.searchParams.forEach((value, key) => {
        //                     queryParams[key] = value.replace(/"/g, "");
        //                });
        //                return queryParams;
        //           };
        //           const appParams = extractQueryParams(args.app);
        //           const email = appParams.email;
        //           const password = appParams.password;
        //           if (!email || !password) {
        //                const session = nms.getSession(id);
        //                session.reject();
        //                return;
        //           }
        //           const authenticate = await authLiveStm(email, password);
        //           console.log("auuut", authenticate);
        //           if (!authenticate) {
        //                console.log("Invalid auth credentials");
        //                const session = nms.getSession(id);
        //                session.reject();
        //           } else {
        //                console.log("Auth Credentials are valid!");
        //           }
        //      } catch (error) {
        //           console.error("Error in validating credentials:", error);
        //      }
        // });
        nms.on('prePublish', async (id, StreamPath, args) => {
            try {
                const streamKey = StreamPath.toString().split('/').pop();
                if (!validStreamKeys.includes(streamKey)) {
                    console.log('Invalid stream key');
                    const session = nms.getSession(id);
                    session.sendStatusMessage(session.publishStreamId, 'error', 'NetStream.publish.Unauthorized', 'Publisehr: Authorization required.');
                    session.reject();
                }
                else {
                    console.log('Stream key is valid:', validStreamKeys);
                }
            }
            catch (error) {
                console.error('Database query error:', error);
                const session = nms.getSession(id);
                session.reject();
            }
        });
        nms.run();
    },
};
module.exports = {
    connect,
    // fetchStreamKeys,
};
