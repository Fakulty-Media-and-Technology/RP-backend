import { Episode, Season } from '../types/movie'
import { OperationalError } from './OperationalError'
import { VidUploadUtils, VideoQuality } from './VideoUploadUtils'
import { VodCardResponse } from '../repositories/VideoRepo'

export class MovieMediaSourcesUtils {
  protected static _getMovieVideoSource = (
    vid: VodCardResponse | Episode,
    routine: 'vid' | 'trailer',
    quality: VideoQuality,
  ) => {
    let source: string | null = null

    if (routine === 'vid') {
      source = vid.videoUpload
        ? VidUploadUtils.getResSourceUrl(vid.videoUpload, quality)
        : vid.videoLink
    }

    if (routine === 'trailer') {
      source = vid.trailerLink
        ? VidUploadUtils.getResSourceUrl(vid.trailerUpload, quality)
        : vid.trailerLink
    }

    return source
  }

  public static resolveSeasonsMediaSources = (seasons: Season[], quality: VideoQuality) => {
    const seasonsWithSources = seasons.map(season => {
      season.episodes = this.resolveEpisodesMediaSources(season.episodes, quality)
      return season
    })

    return seasonsWithSources as Season[]
  }

  public static resolveEpisodesMediaSources = (episodes: Episode[], quality: VideoQuality) => {
    const episodesWithSources = episodes.map(episode => {
      Object.assign(episode, {
        video: this._getMovieVideoSource(episode, 'vid', quality),
        trailer: this._getMovieVideoSource(episode, 'trailer', quality),
        trailerUpload: undefined,
        videoUpload: undefined,
        trailerLink: undefined,
        videoLink: undefined,
      })

      return episode
    })

    return episodesWithSources
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
