const NodeMediaServer = require("node-media-server");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

const connect = {
    name: "live",
    pkg: require("../../package"),
    async register(server, options) {
        const config = {
            logType: 3,
            rtmp: {
                port: 1935,
                chunk_size: 100000,
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
                // ffmpeg: "../../../../ffmpeg",
                ffmpeg: ffmpegPath,
                tasks: [
                    {
                        app: "live",
                        hls: true,
                        hlsFlags:
                            "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
                        mp4: true,
                        mp4Flags: "[movflags=frag_keyframe+empty_moov]",
                        hardwareAccel: true,
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
