import { Aggregate, Types } from 'mongoose'
import { WatchedModel, WatchedSchema } from '../../models/watched.model'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { getPromiseAllFulfilledResults } from '../../utils/promises'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { VideoRepo } from '../../repositories/VideoRepo'
import { SettingsModel } from '../../models/userSettings.model'
import { OperationalError } from '../../utils/OperationalError'
import { SeasonModel } from '../../models/seasons.model'
import { VideoModel } from '../../models/videos.model'
import { EpisodeModel } from '../../models/episodes.model'
import { AdminUploadService } from './AdminUploadService'

interface CreateWatchedTimeInput extends Omit<WatchedSchema, 'userId' | 'createdAt' | 'updatedAt'> {
  currentUserId: string
}

export class WatchedService {
  static deleteById = async (id: string) => {
    const watched = await WatchedModel.findByIdAndDelete(id)

    if (watched == null) {
      throw new OperationalError('invalid id', 404)
    }
  }

  static create = async ({
    currentUserId,
    parentId,
    parentType,
    duration,
    totalDuration,
  }: CreateWatchedTimeInput) => {
    await WatchedModel.findOneAndUpdate(
      { userId: currentUserId, parentId, parentType },
      { $set: { duration, totalDuration } },
      { upsert: true },
    )
  }

  static fetchContinueWatching = async (userId: string, query: ExpressRequestQuery) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const [settingsResult, watchedResults] = await Promise.allSettled([
      SettingsModel.findOne({ user_id: userId }),

      //
      WatchedModel.aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$userId', { $toObjectId: userId }] },
                { $lt: ['$duration', '$totalDuration'] },
              ],
            },
          },
        },

        {
          $project: {
            userId: false,
            __v: false,
            createdAt: false,
            updatedAt: false,
          },
        },

        { $set: { watchedDocumentId: '$_id', _id: '$$REMOVE' } },
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]) as Aggregate<(WatchedSchema & { _id: Types.ObjectId })[]>,
    ])

    if (settingsResult.status === 'rejected') {
      throw settingsResult.reason
    }

    if (watchedResults.status === 'rejected') {
      throw watchedResults.reason
    }

    const quality = settingsResult.value?.video_quality ?? '480p'

    // This entire sh*t is a quick patch from higher up. TODO: Please revisit

    return getPromiseAllFulfilledResults(
      await Promise.allSettled(
        watchedResults.value.map(async watched => {
          switch (watched.parentType) {
            case 'vod':
              const [vod] = MovieMediaSourcesUtils.resolveMediaSources(
                await VideoRepo.fetchById(watched.parentId.toString()),
                quality,
              )

              if (vod == null) {
                throw new Error()
              }

              return Object.assign(watched, { video: vod })

            case 'episode':
              const episode = await EpisodeModel.findById(watched.parentId)

              if (episode == null) {
                throw new Error()
              }

              const season = await SeasonModel.findById(episode.season)

              if (season == null) {
                throw new Error()
              }

              const [populatedVideo] = MovieMediaSourcesUtils.resolveMediaSources(
                await VideoRepo.fetchById(season.video.toString()),
                quality,
              )

              if (populatedVideo === null) {
                throw new Error()
              }

              const seasons = await AdminUploadService.getSeasonsAndEpisodes(
                season.video.toString(),
                {
                  page: season.serial_number,
                  limit: 1,
                },
              )

              let targetEpisode: any = null

              for (const season of seasons) {
                for (const episode of season.episodes) {
                  if (episode._id.toString() === watched.parentId.toString()) {
                    targetEpisode = episode
                    break
                  }
                }
              }

              if (targetEpisode === null) {
                throw new Error()
              }

              // @ts-ignore
              delete populatedVideo.seasons

              return Object.assign(watched, {
                video: populatedVideo,
                episode: targetEpisode,
              })
            default:
              throw new OperationalError('Unkown parent type', 400)
          }
        }),
      ),
    )
  }
}
