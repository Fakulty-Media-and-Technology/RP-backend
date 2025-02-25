import { FilterQuery } from 'mongoose'

import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'
import { VideoModel } from '../../models/videos.model'
import { LiveRepo } from '../../repositories/LiveRepo'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { LiveModel, LiveSchema } from '../../models/lives.model'
import { OperationalError } from '../../utils/OperationalError'

import env from '../../env'
import { MediaManagement } from '../../services/media-management'
import { signCred } from '../../utils/live'
import { VideoRepo } from '../../repositories/VideoRepo'
import { SharedController } from '../common/shared.controller'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { handleDefaultNumAndUnknown } from '../../utils/QueryParamsFeatures'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { LiveAggrRes } from '../../types/Live'
import { Movie } from '../../types/movie'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'

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

export class CustomerSharedController extends SharedController {
  static uploadImageRoute = Catch.async(async ({ file, user }, res) => {
    denyGuestUser(GetDefined.loggedInUser(user))

    if (!file) {
      throw new OperationalError('Upload an image', 400)
    }

    sendResponse({
      res,
      data: await MediaManagement.store({ file, baseDir: 'images', expire: undefined }),
      message: 'image uploaded',
    })
  })

  static getFeaturedVods = Catch.async(async ({ query, user }, res) => {
    const vidQuality = await VidUploadUtils.getUserVideoQuality(
      GetDefined.loggedInUser(user)._id.toString(),
    )

    const vods = await MovieMediaSourcesUtils.resolveMediaSources(
      await VideoRepo.fetchFeatured(
        handleDefaultNumAndUnknown(query.page, 1),
        handleDefaultNumAndUnknown(query.limit, 10),
      ),
      true,
      vidQuality,
    )

    sendResponse({
      res,
      data: vods,
      message: 'featured contents fetched successful',
    })
  })

  static getFeaturedLives = Catch.async(async ({ query, user }, res) => {
    const vidQuality = await VidUploadUtils.getUserVideoQuality(
      GetDefined.loggedInUser(user)._id.toString(),
    )
    sendResponse({
      res,
      message: 'featured contents fetched successful',
      data: await LiveMediaSourcesUtils.resolveSources(
        await LiveRepo.getFeatured(
          handleDefaultNumAndUnknown(query.page, 1),
          handleDefaultNumAndUnknown(query.limit, 10),
        ),
        vidQuality,
      ),
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

  static getLiveEventsByType = (type: LiveEventsType) =>
    Catch.async(async (req, res) => {
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
          filter.type = 'event'
          break
        case 'events popular':
          filter.type = 'event'
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
          filter.type = 'sport'
          filter.popular = true
          break
        case 'sports':
          filter.type = 'sport'
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

      const vidQuality = await VidUploadUtils.getUserVideoQuality(
        GetDefined.loggedInUser(req.user)._id.toString(),
      )

      const liveEvents = await LiveMediaSourcesUtils.resolveSources(
        await LiveRepo.getSelectedLive(
          filter,
          handleDefaultNumAndUnknown(req.query.page, 1),
          handleDefaultNumAndUnknown(req.query.limit, 10),
        ),
        vidQuality,
      )

      sendResponse({
        res,
        data: liveEvents,
        message: 'Events fetched',
      })
    })

  static bannerContents = Catch.async(async (req, res) => {
    const vidQuality = await VidUploadUtils.getUserVideoQuality(
      GetDefined.loggedInUser(req.user)._id.toString(),
    )

    let lives: LiveAggrRes[]
    let vods: Movie[]

      //
    ;[lives, vods] = await Promise.all([
      LiveMediaSourcesUtils.resolveSources(await LiveRepo.getFeatured(), vidQuality),
      MovieMediaSourcesUtils.resolveMediaSources(await VideoRepo.fetchFeatured(), true, vidQuality),
    ])

    if (lives.length + vods.length < 10) {
      ;[lives, vods] = await Promise.all([
        LiveMediaSourcesUtils.resolveSources(await LiveRepo.getMostEngaged(), vidQuality),
        MovieMediaSourcesUtils.resolveMediaSources(
          await VideoRepo.fetchMostEngaged(),
          true,
          vidQuality,
        ),
      ])
    }

    sendResponse({
      res,
      message: 'contents fetched',
      data: {
        lives,
        vods,
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
