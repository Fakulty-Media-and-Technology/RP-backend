import { Aggregate, Types } from 'mongoose'
import { WatchedModel, WatchedSchema } from '../../models/watched.model'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { getPromiseAllFulfilledResults } from '../../utils/promises'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { VideoRepo } from '../../repositories/VideoRepo'
import { SettingsModel } from '../../models/userSettings.model'
import { OperationalError } from '../../utils/OperationalError'

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

    return getPromiseAllFulfilledResults(
      await Promise.allSettled(
        watchedResults.value.map(async watched => {
          switch (watched.parentType) {
            case 'vod':
              const [vod] = await MovieMediaSourcesUtils.resolveMediaSources(
                await VideoRepo.fetchById(watched.parentId.toString()),
                true,
                quality,
              )

              if (vod == null) {
                throw new Error()
              }

              return Object.assign(watched, { video: vod })

            case 'episode':
              const [ep] = await MovieMediaSourcesUtils.resolveEpisodesMediaSources(
                await VideoRepo.fetchEpisodeById(watched.parentId.toString()),
                true,
                quality,
              )

              if (ep == null) {
                throw new Error()
              }

              return Object.assign(watched, { video: ep })
            default:
              break
          }
        }),
      ),
    )
  }
}
