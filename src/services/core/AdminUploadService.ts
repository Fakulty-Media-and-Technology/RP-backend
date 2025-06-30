import { VideoModel } from '../../models/videos.model'
import { OperationalError } from '../../utils/OperationalError'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'

import { VideoRepo } from '../../repositories/VideoRepo'
import { Season } from '../../types/movie'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'

import {
  guranteeNumericResult,
  QueryParamsFeaturesOptions,
} from '../../utils/QueryParamsFeatures'

import {
  AddEpisodeInput,
  AddSeasonParams,
  AddVideoParams,
  AllVideoTypes,
  EditVideoParams,
  UploadMediaUtils,
} from '../../utils/UploadMediaUtils'

import { Purge } from '../../utils/Purge'
import { SeasonModel } from '../../models/seasons.model'

// type EditVideoInput = {
//   vidId: string
//   type: AllVideoTypes
//   changes: Record<string, any>
// }

export class AdminUploadService extends UploadMediaUtils {
  static resolveWithMediaSources = (queryParams: QueryParamsFeaturesOptions['queryParams']) =>
    queryParams.withMediaSources === 'true'

  static addVideo = async (input: AddVideoParams) =>
    await withMongoDBSession(this._uploadVideoSession, input)

  static addSeason = async ({ videoId, adminId, description }: AddSeasonParams) => {
    const aggrRes = await VideoRepo.addSeasonUtilAggr(videoId)

    this._validateWithMovieAndPrevSeasonsAggrResult(aggrRes)

    return await SeasonModel.create({
      description,
      admin: adminId,
      video: videoId,
      serial_number: aggrRes[0].totalPreviousSeasons + 1,
    })
  }

  static canAddSeason = async (videoId: string) => {
    const aggrRes = await VideoRepo.addSeasonUtilAggr(videoId)
    this._validateWithMovieAndPrevSeasonsAggrResult(aggrRes)
  }

  static canAddEpisode = async (seasonId: string) => {
    const aggrUtilsRes = await VideoRepo.addEpisodeUtilAggr(seasonId)
    this._validateWithSeasonAndPrevEpisodes(aggrUtilsRes)
  }

  static addEpisode = async (input: AddEpisodeInput) =>
    await withMongoDBSession(this._addEpisodesWithSession, input)

  static editVideo = async (input: EditVideoParams) =>
    await withMongoDBSession(this._editVideoSession, input)

  static deleteVideo = async (vidId: string, type: AllVideoTypes) => {
    const deletedVid = await VideoModel.findOneAndDelete({ _id: vidId, type })

    if (deletedVid == null) {
      throw new OperationalError(`Not found or video is not a ${type} `, 404)
    }

    // do not await
    Purge.vod(deletedVid)
  }

  static getVideos = async (
    type: AllVideoTypes,
    queryParams: QueryParamsFeaturesOptions['queryParams'],
  ) => {
    const vids = await VideoRepo.fetchByType(
      type,
      guranteeNumericResult(queryParams.page, 1),
      guranteeNumericResult(queryParams.limit, 1),
    )

    const vidsWithSources = await MovieMediaSourcesUtils.resolveMediaSources(
      vids,
      this.resolveWithMediaSources(queryParams),
      '720p',
    )

    return vidsWithSources
  }

  static getSeasonsAndEpisodes = async (
    vidSeriesId: string,
    queryParams: QueryParamsFeaturesOptions['queryParams'],
  ) => {
    const vid = await VideoModel.findById(vidSeriesId)

    if (vid == null) {
      throw new OperationalError('invalid video Id', 404)
    }

    if (!vid.is_series) {
      throw new OperationalError('video is not a series', 400)
    }

    const page = guranteeNumericResult(queryParams.page, 1)
    const limit = guranteeNumericResult(queryParams.limit, 10)
    const seasons = (await VideoRepo.fetchSeasonsAndEpisodes(vidSeriesId, page, limit)) as Season[]

    const seasonsWithMediaSources = await MovieMediaSourcesUtils.resolveSeasonsMediaSources(
      seasons,
      this.resolveWithMediaSources(queryParams),
      '720p',
      MovieMediaSourcesUtils.resolveEpisodesMediaSources,
    )

    return seasonsWithMediaSources
  }
}
