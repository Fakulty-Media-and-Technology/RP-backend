import { FilterQuery } from 'mongoose'
import { getSignedUrl as getCFSignedUrl } from '@aws-sdk/cloudfront-signer'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'

import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'
import { VideoModel } from '../../models/videos.model'
import { LiveRepo } from '../../repositories/LiveRepo'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { Live, LiveSchema } from '../../models/lives.model'
import { SettingsModel } from '../../models/userSettings.model'
import { OperationalError } from '../../utils/OperationalError'

import env from '../../env'
import { MediaManagement } from '../../services/media-management'
import { MediaAccess } from '../../services/media-access'
import { AwsUtils } from '../../services/aws/utils'
import { MediaConvert } from '../../services/aws/mediaConvert'

type GetLiveEventsWithPhotoUrlResult = {
  liveEvent: Live
  photo_url: Awaited<ReturnType<typeof MediaAccess.getSignedUrl>>
}

type GetLiveEventsWithPhotoUrlResults = Array<GetLiveEventsWithPhotoUrlResult>

export class CustomerMediaController {
  private static _mergeEventAndPhotoUrl = (results: GetLiveEventsWithPhotoUrlResults) => {
    return results.map(result => ({ ...result.liveEvent, photo_url: result.photo_url }))
  }

  static uploadImageRoute = Catch.async(async ({ file, body: { fileName }, user }, res) => {
    denyGuestUser(GetDefined.loggedInUser(user))

    if (!file) {
      throw new OperationalError('Upload an image', 400)
    }

    sendResponse({
      res,
      data: await MediaManagement.uploadImageOrSubtitle({ file, fileName, type: 'image' }),
      message: 'image uploaded',
    })
  })

  static customerGetPhotoUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body

    sendResponse({
      res,
      data: await MediaAccess.getSignedUrl(bucket, key, 'photo'),
      message: 'image uploaded',
    })
  })

  static vodStream = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const user = GetDefined.loggedInUser(req.user)

    // const transPath = `s3://reeplay/transcode/${key.split('/').slice(1).join('/')}`
    const transPath = `${AwsUtils.buckets.transcodeOutput}/${key}`

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `transcode/${key.split('/').slice(1).join('/')}/`,
      MaxKeys: 1,
    })

    const data = await AwsUtils.clients.s3.send(command)

    if (data.Contents == null) {
      console.dir({ errorMessage: '🛑Error fetching S3 data objects', data }, { depth: null })
      throw new OperationalError('Could not list data contents', 500)
    }

    const checkTranscodedFolder = data.Contents.length > 0

    if (checkTranscodedFolder != true) {
      await MediaConvert.transcode(key)

      throw new OperationalError(
        'Oops, check back in few minutes, wait while the video is being transcoded',
        500,
      )
    }

    const user_resolution = await SettingsModel.findOne({ user_id: user.id })
    const userRes = user_resolution?.video_quality || '480p'

    const url = `${env.CFSDISTRIBUTION}/${key
      .split('/')
      .slice(1)
      .join('/')}/${key.split('/').slice(1).join('/')}_${userRes}.mp4`

    const privateKey = env.CFS_PRIVATE_KEY.replace(/\\n/g, '\n')
    const expirationDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    // access transcoded files with cloudfront
    const signedUrl = getCFSignedUrl({
      url: url,
      keyPairId: env.KEY_PAIR_ID,
      dateLessThan: expirationDate.toISOString(),
      privateKey: privateKey,
    })

    sendResponse({
      res,
      message: 'video streaming',
      data: {
        video_content: signedUrl,
      },
    })
  })

  static getFeaturedVods = Catch.async(async (_, res) => {
    const vods = await VideoModel.find({ featured: true })

    // for (let vod of vods) {
    //      if (
    //           vod.cover_photo &&
    //           vod.cover_photo.Bucket &&
    //           vod.cover_photo.Key
    //      ) {
    //           const signedUrl = await readPhotos(
    //                vod.cover_photo.Bucket,
    //                vod.cover_photo.Key
    //           );
    //           vod.photo_url =
    //                signedUrl.status == 400 ? "no picture" : signedUrl;
    //      } else {
    //           vod.photo_url = "no picture";
    //      }
    // }

    sendResponse({
      res,
      data: vods,
      message: 'featured contents fetched successful',
    })
  })

  // ***************** likes ************************ //

  static likeVideo = Catch.async(async (req, res) => {
    const streamId = req.params.id

    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const resLikes = await VideoModel.findById(streamId)

    if (resLikes == null) {
      throw new OperationalError('Could not find video by streamId', 404)
    }

    if (resLikes.likes.includes(user._id)) {
      throw new OperationalError('user already liked', 400)
    }

    await VideoModel.findByIdAndUpdate(streamId, {
      $push: {
        likes: user._id,
      },
    })

    sendResponse({
      res,
      message: 'video liked',
    })
  })

  static userLikedVideo = Catch.async(async (req, res) => {
    const streamId = req.params.id

    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const resLikes = await VideoModel.findById(streamId)

    if (resLikes == null) {
      throw new OperationalError('Could not find video by streamId', 404)
    }

    sendResponse({
      res,
      message: 'check user liked',
      data: {
        user_liked: resLikes.likes.includes(user.id),
      },
    })
  })

  static unLikeVideo = Catch.async(async (req, res) => {
    const streamId = req.params.id

    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const vod = await VideoModel.findOneAndUpdate(
      {
        _id: streamId,
        likes: user.id,
      },
      {
        $pull: {
          likes: user.id,
        },
      },
    )

    if (vod === null) {
      throw new OperationalError('user did not like the video or video does not exist', 404)
    }

    sendResponse({
      res,
      message: 'video unliked',
    })
  })

  // ************ GET EVENTS *********************//

  private static _getLiveEventsWithPhotoUrl = async (filterQuery: FilterQuery<LiveSchema>) => {
    const liveEvents = await LiveRepo.getSelectedLive(filterQuery)

    const settledResults = await Promise.allSettled(
      liveEvents.map(async event => {
        const signedUrl = await MediaAccess.getSignedUrl(
          event.cover_photo.Bucket,
          event.cover_photo.Key,
          'photo',
        )

        const result: GetLiveEventsWithPhotoUrlResult = {
          liveEvent: event,
          photo_url: signedUrl,
        }

        return result
      }),
    )

    const results: GetLiveEventsWithPhotoUrlResults = []

    settledResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      }
    })

    return results
  }

  static getLiveEvents = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched',
    })
  })

  static getLiveEventsFeatured = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      featured: true,
    })

    sendResponse({
      res,
      data: liveEvents,
      message: 'live featured events fetched',
    })
  })

  static getLiveEventsSponsored = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      sponsored: true,
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'sponsored live events fetched',
    })
  })

  static getLiveEventsChannels = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'channel',
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched: channels',
    })
  })

  static getLiveEventsChannelsPop = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'channel',
      popular: true,
    })

    sendResponse({
      res,
      data: liveEvents,
      message: 'live events fetched: popular',
    })
  })

  static getLiveEventsEven = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'events',
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched: events',
    })
  })

  static getLiveEventsEvenPop = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'events',
      popular: true,
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched: popular events',
    })
  })

  static getLiveEventsTvshow = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'tvshow',
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched: tvshow',
    })
  })

  static getLiveEventsTvshowPop = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'tvshow',
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched: tvshow popular',
    })
  })

  static getLiveEventsSports = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'sports',
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched: sports',
    })
  })

  static getLiveEventsSportsPop = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'sports',
      popular: true,
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched: sports popular',
    })
  })

  static getLiveEventsPodcast = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'podcast',
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched: podcast',
    })
  })

  static getLiveEventsPodcastPop = Catch.async(async (_, res) => {
    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      expired: false,
      type: 'podcast',
      popular: true,
    })

    sendResponse({
      res,
      data: this._mergeEventAndPhotoUrl(liveEvents),
      message: 'live events fetched: podcast popular',
    })
  })

  static streamLiveEvent = Catch.async(async (req, res) => {
    const streamId = req.params.id

    const liveEvents = await this._getLiveEventsWithPhotoUrl({
      _id: streamId,
      expired: false,
    })

    if (liveEvents.length === 0) {
      throw new OperationalError('there are no live events', 404)
    }

    const firstLiveEvent = liveEvents[0].liveEvent
    const stream_url = `${env.RP_HLS_URL}${firstLiveEvent.stream_key}/index.m3u8`

    firstLiveEvent.stream_key = null
    await firstLiveEvent.save()

    const data = {
      live_data: firstLiveEvent,
      url: stream_url,
    }

    sendResponse({
      res,
      data,
      message: 'live events fetched',
    })
  })
}
