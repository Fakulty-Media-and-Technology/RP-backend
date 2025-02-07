import { FilterQuery } from 'mongoose'

import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'
import { VideoModel } from '../../models/videos.model'
import { LiveRepo } from '../../repositories/LiveRepo'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { Live, LiveModel, LiveSchema } from '../../models/lives.model'
import { OperationalError } from '../../utils/OperationalError'

import env from '../../env'
import { MediaManagement } from '../../services/media-management'
import { MediaAccess } from '../../services/media-access'
import { signCred } from '../../utils/live'
import { VideoRepo } from '../../repositories/VideoRepo'
import { MediaController } from '../common/media.controller'

type GetLiveEventsWithPhotoUrlResult = {
  liveEvent: Live
  photo_url: Awaited<ReturnType<typeof MediaAccess.getSignedUrl>>
}

type LiveEventsType =
  | 'all'
  | 'featured'
  | 'sponsored'
  | 'channels'
  | 'channels popular'
  | 'events'
  | 'events popular'
  | 'tvshows popular'
  | 'tvshows'
  | 'sports'
  | 'sports popular'
  | 'podcasts'
  | 'podcasts popular'

type GetLiveEventsWithPhotoUrlResults = Array<GetLiveEventsWithPhotoUrlResult>

export class CustomerMediaController extends MediaController {
  static uploadImageRoute = Catch.async(async ({ file, user }, res) => {
    denyGuestUser(GetDefined.loggedInUser(user))

    if (!file) {
      throw new OperationalError('Upload an image', 400)
    }

    sendResponse({
      res,
      data: await MediaManagement.uploadImageOrSubtitle({ file, type: 'image' }),
      message: 'image uploaded',
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

  private static _mergeEventAndPhotoUrl = (results: GetLiveEventsWithPhotoUrlResults) => {
    return results.map(result => ({ ...result.liveEvent, photo_url: result.photo_url }))
  }

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

  static getLiveEventsByType = (type: LiveEventsType) =>
    Catch.async(async (_, res) => {
      let filter: FilterQuery<LiveSchema> = { expired: false }

      switch (type) {
        case 'featured':
          filter.featured = true
          break
        case 'sponsored':
          filter.sponsored = true
          break
        case 'channels':
          filter.type = 'channel'
          break
        case 'channels popular':
          filter.type = 'channel'
          filter.popular = true
          break
        case 'events':
          filter.type = 'events'
          break
        case 'events popular':
          filter.type = 'events'
          filter.popular = true
          break
        case 'tvshows':
          filter.type = 'tvshow'
          break
        case 'tvshows popular':
          filter.type = 'tvshow'
          filter.popular = true
          break
        case 'sports popular':
          filter.type = 'sports'
          filter.popular = true
          break
        case 'sports':
          filter.type = 'sports'
          break
        case 'podcasts':
          filter.type = 'podcast'
          break
        case 'podcasts popular':
          filter.type = 'podcast'
          filter.popular = true
          break

        default:
          filter = filter
          break
      }

      const liveEvents = await this._getLiveEventsWithPhotoUrl(filter)

      sendResponse({
        res,
        data: this._mergeEventAndPhotoUrl(liveEvents),
        message: 'Events fetched',
      })
    })

  static bannerContents = Catch.async(async (_, res) => {
    const [featuredLives, featuredVods, engagedLives, engagedVods] = await Promise.all([
      // featured
      LiveRepo.getFeatured().sort({ $natural: -1 }).limit(10),
      VideoRepo.getFeatured().sort({ $natural: -1 }).limit(10),

      // engagements
      LiveRepo.getMostEngaged(),
      VideoRepo.getMostEngaged(),
    ])

    sendResponse({
      res,
      message: 'contents fetched',
      data: {
        featured: { lives: featuredLives, vods: featuredVods },
        mostEnagaged: { lives: engagedLives, vods: engagedVods },
      },
    })
  })

  static streamLiveEvent = Catch.async(async (req, res) => {
    const streamId = req.params.id
    const event = await LiveModel.findById(streamId)

    if (event == null) {
      throw new OperationalError('invalid stream ID', 404)
    }

    if (event.expired) {
      throw new OperationalError('stream event has expired', 400)
    }

    const signed = `?sign=${signCred(event.stream_key, event.expiry)}`
    const stream_url = `${env.RP_HLS_URL}${event.stream_key}/index.m3u8` + signed

    const data = {
      live_data: event,
      url: stream_url,
    }

    sendResponse({
      res,
      data,
      message: 'live event fetched',
    })
  })
}
