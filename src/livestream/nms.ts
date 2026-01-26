import NodeMediaServer from 'node-media-server'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

import env from '../env'
import { Assets } from '../utils/Assets'
import { Catch } from '../utils/Catch'
import { LiveModel } from '../models/lives.model'
import { OperationalError } from '../utils/OperationalError'
import { Notification } from '../notifications/notification'

const checkedValidLivestreamByStreamKey = async (streamKey: string | null | undefined) => {
  const now = new Date()

  if (streamKey == null) {
    throw new OperationalError('Expected a stream key', 404)
  }

  const liveDocument = await LiveModel.findOne({ stream_key: streamKey })
    .select('expiry title coverPhoto')
    .lean()

  if (liveDocument == null) {
    throw new OperationalError(`Stream key: ${streamKey} is invalid`, 404)
  }

  if (liveDocument.expiry < now) {
    throw new OperationalError(`Stream key: ${streamKey} belongs to an expired event`, 400)
  }

  return liveDocument
}

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
        const streamKey = streamPath.split('/').pop()

        try {
          const liveDocument = await checkedValidLivestreamByStreamKey(streamKey)
          const liveId = liveDocument._id.toString()
          const image =
            liveDocument.coverPhoto && `${env.CDN_IMAGES_BASE_URL}/${liveDocument.coverPhoto.Key}`

          Notification.sendTopicPushNotification(Notification.makeContentTopic(liveId, 'LIVE'), {
            title: 'Update',
            type: 'LIVE_EVENT_REMINDER',
            body: `It's LIVE now: ${liveDocument.title} Tap to Join`,
            image,
            metadata: { liveId },
          })
        } catch (e) {
          console.error('Publish livestream error', e)
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
      secret: env.RP_RMTP_AUTH_SECRET,
    },

    trans: {
      ffmpeg: ffmpegInstaller.path,
      tasks: [
        {
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
          app: env.RP_RTMP_APP_NAME,
          hls: true,
          cleanup: true,
          hlsKeep: false,
        },
      ],
    },

    // trans: {
    //   ffmpeg: ffmpegPath,
    //   tasks: [
    //     {
    //       app: env.RP_RTMP_APP_NAME,
    //       hls: true,
    //       raw: [
    //         '-vf',
    //         'scale=w=640:h=360:force_original_aspect_ratio=decrease',
    //         '-c:a',
    //         'aac',
    //         '-ar',
    //         '48000',
    //         '-c:v',
    //         'libx264',
    //         '-preset',
    //         'veryfast',
    //         '-profile:v',
    //         'main',
    //         '-crf',
    //         '20',
    //         '-sc_threshold',
    //         '0',
    //         '-g',
    //         '48',
    //         '-keyint_min',
    //         '48',
    //         '-hls_time',
    //         '6',
    //         '-hls_list_size',
    //         '10',
    //         '-hls_flags',
    //         'delete_segments',
    //         '-max_muxing_queue_size',
    //         '1024',
    //         '-start_number',
    //         '${timeInMilliseconds}',
    //         '-b:v',
    //         '800k',
    //         '-maxrate',
    //         '856k',
    //         '-bufsize',
    //         '1200k',
    //         '-b:a',
    //         '96k',
    //         '-hls_segment_filename',
    //         '${mediaroot}/${streamName}/360p/%03d.ts',
    //         '${mediaroot}/${streamName}/360p/index.m3u8',
    //         '-vf',
    //         'scale=w=842:h=480:force_original_aspect_ratio=decrease',
    //         '-c:a',
    //         'aac',
    //         '-ar',
    //         '48000',
    //         '-c:v',
    //         'libx264',
    //         '-preset',
    //         'veryfast',
    //         '-profile:v',
    //         'main',
    //         '-crf',
    //         '20',
    //         '-sc_threshold',
    //         '0',
    //         '-g',
    //         '48',
    //         '-keyint_min',
    //         '48',
    //         '-hls_time',
    //         '6',
    //         '-hls_list_size',
    //         '10',
    //         '-hls_flags',
    //         'delete_segments',
    //         '-max_muxing_queue_size',
    //         '1024',
    //         '-start_number',
    //         '${timeInMilliseconds}',
    //         '-b:v',
    //         '1400k',
    //         '-maxrate',
    //         '1498k',
    //         '-bufsize',
    //         '2100k',
    //         '-b:a',
    //         '128k',
    //         '-hls_segment_filename',
    //         '${mediaroot}/${streamName}/480p/%03d.ts',
    //         '${mediaroot}/${streamName}/480p/index.m3u8',
    //         '-vf',
    //         'scale=w=1280:h=720:force_original_aspect_ratio=decrease',
    //         '-c:a',
    //         'aac',
    //         '-ar',
    //         '48000',
    //         '-c:v',
    //         'libx264',
    //         '-preset',
    //         'veryfast',
    //         '-profile:v',
    //         'main',
    //         '-crf',
    //         '20',
    //         '-sc_threshold',
    //         '0',
    //         '-g',
    //         '48',
    //         '-keyint_min',
    //         '48',
    //         '-hls_time',
    //         '6',
    //         '-hls_list_size',
    //         '10',
    //         '-hls_flags',
    //         'delete_segments',
    //         '-max_muxing_queue_size',
    //         '1024',
    //         '-start_number',
    //         '${timeInMilliseconds}',
    //         '-b:v',
    //         '2800k',
    //         '-maxrate',
    //         '2996k',
    //         '-bufsize',
    //         '4200k',
    //         '-b:a',
    //         '128k',
    //         '-hls_segment_filename',
    //         '${mediaroot}/${streamName}/720p/%03d.ts',
    //         '${mediaroot}/${streamName}/720p/index.m3u8',
    //       ],

    //       ouPaths: [
    //         '${mediaroot}/${streamName}/360p',
    //         '${mediaroot}/${streamName}/480p',
    //         '${mediaroot}/${streamName}/720p',
    //       ],
    //       hlsFlags: '',
    //       cleanup: false,
    //     },
    //   ],
    // },
  }
}
