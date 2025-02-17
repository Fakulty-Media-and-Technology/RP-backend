import { VideoModel } from '../../models/videos.model'
import { OperationalError } from '../../utils/OperationalError'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'

import { VideoRepo } from '../../repositories/VideoRepo'
import { Season } from '../../types/movie'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'

import {
  handleDefaultNumAndUnknown,
  QueryParamsFeaturesOptions,
} from '../../utils/QueryParamsFeatures'

import {
  AddEpisodeInput,
  AddSeasonParams,
  AddVideoParams,
  AllVideoTypes,
  UploadMediaUtils,
} from '../../utils/UploadMediaUtils'

type EditVideoInput = {
  vidId: string
  type: AllVideoTypes
  changes: Record<string, any>
}

export class AdminUploadService extends UploadMediaUtils {
  static resolveWithMediaSources = (queryParams: QueryParamsFeaturesOptions['queryParams']) =>
    queryParams.withMediaSources === 'true'

  static addVideo = async (input: AddVideoParams) =>
    await withMongoDBSession(this._uploadVideoSession, input)

  static addSeason = async (params: AddSeasonParams) =>
    await withMongoDBSession(this._addSeasonWithSession, params)

  static addEpisode = async (input: AddEpisodeInput) =>
    await withMongoDBSession(this._addEpisodesWithSession, input)

  static editVideo = async ({ vidId, type, changes }: EditVideoInput) => {
    const video = await VideoModel.findOne({ _id: vidId, type })

    if (video == null) {
      throw new OperationalError('video does not exist or does not exist as this type', 400)
    }

    delete changes['_id']

    const updatedVid = await VideoModel.findOneAndUpdate(
      {
        _id: vidId,
        type,
      },
      changes,
      {
        new: true,
      },
    )

    if (updatedVid == null) {
      throw new OperationalError('Could not update video or video does not exist', 404)
    }

    return updatedVid
  }

  static deleteVideo = async (vidId: string, type: AllVideoTypes) => {
    const deletedVid = await VideoModel.findOneAndDelete({ _id: vidId, type })

    if (deletedVid == null) {
      throw new OperationalError(`Not found or video is not a ${type} `, 404)
    }
  }

  static getVideos = async (
    type: AllVideoTypes,
    queryParams: QueryParamsFeaturesOptions['queryParams'],
  ) => {
    const vids = await VideoRepo.fetchByType(
      type,
      handleDefaultNumAndUnknown(queryParams.page, 1),
      handleDefaultNumAndUnknown(queryParams.limit, 1),
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

    const page = handleDefaultNumAndUnknown(queryParams.page, 1)
    const limit = handleDefaultNumAndUnknown(queryParams.limit, 10)
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
