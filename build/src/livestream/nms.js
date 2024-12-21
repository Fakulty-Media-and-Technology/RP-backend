"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaStream = void 0;
const node_media_server_1 = __importDefault(require("node-media-server"));
const ffmpeg_1 = require("@ffmpeg-installer/ffmpeg");
const nms_1 = require("../utils/nms");
const Assets_1 = require("../utils/Assets");
const Catch_1 = require("../utils/Catch");
const OperationalError_1 = require("../utils/OperationalError");
const env_1 = __importDefault(require("../env"));
class MediaStream {
    static launch() {
        const config = {
            logType: env_1.default.IS_PROD ? 1 : 3, // log only errors in prod
            rtmp: {
                port: 1935,
                chunk_size: 60000,
                gop_cache: true,
                ping: 30,
                ping_timeout: 60,
            },
            http: {
                port: env_1.default.MEDIA_SERVER_HTTP_PORT,
                mediaroot: './' + Assets_1.Assets.rootMediaDirs.nodeMediaServer,
                allow_origin: '*',
            },
            auth: {
                play: true,
                publish: true,
                secret: 'nodemedia2017privatekey',
            },
            trans: {
                ffmpeg: ffmpeg_1.path,
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
        const nms = new node_media_server_1.default(config);
        nms.on('prePublish', Catch_1.Catch.NMSPrePublishAsync(async (id, streamPath) => {
            const session = nms.getSession(id);
            const streamKey = streamPath.split('/').pop();
            const validStreamKeys = await (0, nms_1.fetchValidStreamKeys)();
            if (validStreamKeys === null) {
                // @ts-ignore
                session.reject();
                throw new OperationalError_1.OperationalError(' no active stream keys or there was an error fetching the stream keys', 404);
            }
            if (!validStreamKeys.includes(streamKey)) {
                // @ts-ignore
                session.sendStatusMessage(
                // @ts-ignore
                session.publishStreamId, 'error', 'NetStream.publish.Unauthorized', 'Publisehr: Authorization required.');
                // @ts-ignore
                session.reject();
            }
        }));
        nms.run();
    }
}
exports.MediaStream = MediaStream;
