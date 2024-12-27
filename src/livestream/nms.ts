import NodeMediaServer from 'node-media-server'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import { fetchValidStreamKeys } from '../utils/nms'
import { Assets } from '../utils/Assets'
import { Catch } from '../utils/Catch'
import { OperationalError } from '../utils/OperationalError'
import env from '../env'

export class MediaStream {
  nms: NodeMediaServer

  constructor() {
    this.nms = new NodeMediaServer(this._config)
  }

  initiate() {
    this.nms.on(
      'prePublish',
      Catch.NMSPrePublishAsync(async (id, streamPath) => {
        const session = this.nms.getSession(id)
        const streamKey = streamPath.split('/').pop() as string

        const validStreamKeys = await fetchValidStreamKeys()

        if (validStreamKeys === null) {
          // @ts-ignore
          session.reject()

          throw new OperationalError(
            ' no active stream keys or there was an error fetching the stream keys',
            404,
          )
        }

        if (!validStreamKeys.includes(streamKey)) {
          // @ts-ignore
          session.sendStatusMessage(
            // @ts-ignore
            session.publishStreamId,
            'error',
            'NetStream.publish.Unauthorized',
            'Publisehr: Authorization required.',
          )

          // @ts-ignore
          session.reject()
        }
      }),
    )

    this.nms.run()
  }

  close() {
    this.nms.stop()
    console.log('Node media server stopped successfully')
  }

  private _config = {
    rtmp: {
      port: env.RP_RTMP_PORT,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60,
    },

    http: {
      port: env.RP_HLS_HTTP_PORT,
      mediaroot: './' + Assets.rootMediaDirs.nodeMediaServer,
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
          app: env.RP_RTMP_APP_NAME,
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
  }
}
