import { MediaAccess } from '../services/media-access'
import { Episode, GetVideoSourceParams, Movie, Season } from '../types/movie'
import { OperationalError } from './OperationalError'
import { getPromiseAllFulfilledResults } from './promises'
import { VidUploadUtils, VidRes } from './VideoUploadUtils'

import { UpcomingAggrRes } from '../types/upcoming'

export class MovieMediaSourcesUtils {
  protected static _getMoviePhotos = async (vid: Movie | UpcomingAggrRes) => {
    const [landscapePhoto, portraitPhoto] = await Promise.all([
      MediaAccess.getSignedUrl(vid.landscapePhoto.bucket, vid.landscapePhoto.key, 'photo'),
      MediaAccess.getSignedUrl(vid.portraitPhoto.bucket, vid.portraitPhoto.key, 'photo'),
    ])

    return { landscapePhoto, portraitPhoto }
  }

  private static _getMovieVideoSource = (
    vid: GetVideoSourceParams,
    routine: 'vid' | 'trailer',
    quality: VidRes,
  ) => {
    switch (routine) {
      case 'vid':
        return vid.videoLink
          ? vid.videoLink
          : VidUploadUtils.getResSourceUrl(vid.videoUpload, quality)
      case 'trailer':
        return vid.trailerLink
          ? vid.trailerLink
          : VidUploadUtils.getResSourceUrl(vid.trailerVideoUpload, quality)

      default:
        throw new OperationalError('invalid getVideoSource routine', 500)
    }
  }

  public static resolveSeasonsMediaSources = async (
    seasons: Season[],
    withMediaSources: boolean,
    quality: VidRes,
    episodesMediaResolver?: (
      e: Episode[],
      withMediaSources: boolean,
      quality: VidRes,
    ) => Promise<Episode[]>,
  ) => {
    const seasonsWithSources = await Promise.all(
      seasons.map(async season => {
        Object.assign(season, {
          trailer: this._getMovieVideoSource(season, 'trailer', quality),

          landscapePhoto: season.landscapePhoto
            ? await MediaAccess.getSignedUrl(
                season.landscapePhoto.bucket,
                season.landscapePhoto.key,
                'photo',
              )
            : null,

          portraitPhoto: season.portraitPhoto
            ? await MediaAccess.getSignedUrl(
                season.portraitPhoto.bucket,
                season.portraitPhoto.key,
                'photo',
              )
            : null,

          trailerVideoUpload: undefined,
        })

        if (episodesMediaResolver) {
          season.episodes = await episodesMediaResolver(season.episodes, withMediaSources, quality)
        }

        return season
      }),
    )

    return seasonsWithSources as Season[]
  }
  public static resolveEpisodesMediaSources = async (
    episodes: Episode[],
    withMediaSources: boolean,
    quality: VidRes,
  ) => {
    const episodesWithSources = await Promise.all(
      episodes.map(async episode => {
        if (withMediaSources) {
          Object.assign(episode, {
            trailerVideoUpload: undefined,
            videoUpload: undefined,
            subtitleLang: episode.subtitle?.language,
            video: this._getMovieVideoSource(episode, 'vid', quality),
            trailer: this._getMovieVideoSource(episode, 'trailer', quality),
            subtitle: episode.subtitle
              ? await MediaAccess.getSignedUrl(
                  episode.subtitle.bucket,
                  episode.subtitle.key,
                  'subtitle',
                )
              : null,
          })
        }

        return episode
      }),
    )

    return episodesWithSources as unknown as Episode[]
  }

  public static resolveMediaSources = async (
    vids: Movie[],
    withMediaSources: boolean,
    quality: VidRes,
  ) => {
    const movies = await Promise.allSettled(
      vids.map(async vid => {
        const { landscapePhoto, portraitPhoto } = await this._getMoviePhotos(vid)

        vid.seasons = await MovieMediaSourcesUtils.resolveSeasonsMediaSources(
          vid.seasons,
          withMediaSources,
          quality,
          MovieMediaSourcesUtils.resolveEpisodesMediaSources,
        )

        Object.assign(vid, {
          landscapePhoto,
          portraitPhoto,
        })

        if (withMediaSources) {
          Object.assign(vid, {
            video: this._getMovieVideoSource(vid, 'vid', quality),
            trailer: this._getMovieVideoSource(vid, 'trailer', quality),

            subtitleLang: vid.subtitle?.language,
            subtitle: vid.subtitle
              ? await MediaAccess.getSignedUrl(vid.subtitle.bucket, vid.subtitle.key, 'subtitle')
              : null,

            trailerVideoUpload: undefined,
            videoUpload: undefined,
            trailerLink: undefined,
            videoLink: undefined,
          })
        }

        return vid
      }),
    )

    return getPromiseAllFulfilledResults(movies)
  }
}
