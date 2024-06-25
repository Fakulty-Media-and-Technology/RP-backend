const NodeMediaServer = require("node-media-server");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

const connect = {
    name: "live",
    pkg: require("../../package"),
    async register() {
        const config = {
            logType: 4,
            rtmp: {
                port: 1935,
                chunk_size: 60000,
                gop_cache: true,
                ping: 30,
                ping_timeout: 60,
            },
            http: {
                port: process.env.MEDIA_SERVER_PORT || 8888,
                mediaroot: "./media",
                allow_origin: "*",
            },
            trans: {
                ffmpeg: ffmpegPath,
                tasks: [
                    {
                        app: "live",
                        hls: true,
                        hlsFlags:
                            "[hls_time=4:hls_list_size=6:hls_flags=delete_segments]",
                        mp4: true,
                        mp4Flags: "[movflags=frag_keyframe+empty_moov]",
                        hardwareAccel: true,
                        outputs: [
                            {
                                resolution: "854x480",
                                bitrate: "1200k",
                                output: "480p.m3u8",
                            },
                            {
                                resolution: "1280x720",
                                bitrate: "3000k",
                                output: "720p.m3u8",
                            },
                            {
                                resolution: "1920x1080",
                                bitrate: "5000k",
                                output: "1080p.m3u8",
                            },
                            {
                                resolution: "3840x2160",
                                bitrate: "12000k",
                                output: "2160p.m3u8",
                            },
                        ],
                    },
                ],
            },
        };

        const nms = new NodeMediaServer(config);

        // nms.on('prePublish', async (id, StreamPath, args) => {
        //     const streamKey = getStreamKeyFromStreamPath(StreamPath);
        //     console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);

        //     try {
        //         const streamKeyDoc = await LiveSteam.findOne({ key: streamKey, isActive: true });
        //         if (streamKeyDoc) {
        //             console.log('Stream key is valid');
        //         } else {
        //             console.log('Invalid stream key');
        //             const session = nms.getSession(id);
        //             session.reject();
        //         }
        //     } catch (error) {
        //         console.error('Database query error:', error);
        //         const session = nms.getSession(id);
        //         session.reject();
        //     }
        // });

        nms.run();
    },
};

module.exports = connect;
