import { MediaAccess } from '../services/media-access'
import { Episode, GetVideoSourceParams, Movie, Season } from '../types/movie'
import { OperationalError } from './OperationalError'
import { getPromiseAllFulfilledResults } from './promises'
import { VidUploadUtils, VideoQuality } from './VideoUploadUtils'

import { UpcomingAggrRes } from '../types/upcoming'
import { CastEnumService } from '../services/core/CastEnumService'
import { VideoUpload, VodCardResponse } from '../repositories/VideoRepo'

export class MovieMediaSourcesUtils {
  protected static _getMovieVideoSource = (
    vid: VodCardResponse,
    routine: 'vid' | 'trailer',
    quality: VideoQuality,
  ) => {
    switch (routine) {
      case 'vid':
        return vid.videoLink ?? VidUploadUtils.getResSourceUrl(vid.videoUpload, quality)
      case 'trailer':
        return vid.trailerLink ?? VidUploadUtils.getResSourceUrl(vid.trailerUpload, quality)
      default:
        throw new OperationalError('invalid getVideoSource routine', 500)
    }
  }

  public static resolveSeasonsMediaSources = async (
    seasons: Season[],
    withMediaSources: boolean,
    quality: VideoQuality,
  ) => {
    const seasonsWithSources = await Promise.all(
      seasons.map(async season => {
        season.episodes = await this.resolveEpisodesMediaSources(
          season.episodes,
          withMediaSources,
          quality,
        )

        return season
      }),
    )

    return seasonsWithSources as Season[]
  }

  public static resolveEpisodesMediaSources = async (
    episodes: Episode[],
    _: boolean,
    __: VideoQuality,
  ) => {
    const episodesWithSources = await Promise.all(
      episodes.map(async episode => {
        // if (!withMediaSources) return

        // Object.assign(episode, {
        //   video: this._getMovieVideoSource(episode, 'vid', quality),
        //   trailer: this._getMovieVideoSource(episode, 'trailer', quality),
        //   trailerVideoUpload: undefined,
        //   videoUpload: undefined,
        //   trailerLink: undefined,
        //   videoLink: undefined,
        // })

        return episode
      }),
    )

    return episodesWithSources as unknown as Episode[]
  }

  public static resolveMediaSources = (videoDocuments: VodCardResponse[], quality: VideoQuality) =>
    videoDocuments.map(videoDocument => {
      Object.assign(videoDocument, {
        video: this._getMovieVideoSource(videoDocument, 'vid', quality),
        trailer: this._getMovieVideoSource(videoDocument, 'trailer', quality),
        trailerUpload: undefined,
        videoUpload: undefined,
        trailerLink: undefined,
        videoLink: undefined,
      })

      return videoDocument
    })
}
