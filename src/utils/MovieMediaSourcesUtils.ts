import { MediaAccess } from '../services/media-access'
import { Episode, GetVideoSourceParams, Movie, Season } from '../types/movie'
import { OperationalError } from './OperationalError'
import { getPromiseAllFulfilledResults } from './promises'
import { VidUploadUtils, VidRes } from './VideoUploadUtils'

export class MovieMediaSourcesUtils {
  private static _getMoviePhotos = async (vid: Movie) => {
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
          : VidUploadUtils.getResSourceUrl(vid.trailerVideoUpload, quality)

      case 'trailer':
        return vid.trailerLink
          ? vid.trailerLink
          : VidUploadUtils.getResSourceUrl(vid.videoUpload, quality)

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
        // process trailerLink and trailervideoUpload

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

            mediaSources: {
              videoSource: this._getMovieVideoSource(episode, 'vid', quality),
              trailerSource: this._getMovieVideoSource(episode, 'trailer', quality),
              subtitleSource: episode.subtitle
                ? await MediaAccess.getSignedUrl(
                    episode.subtitle.bucket,
                    episode.subtitle.key,
                    'subtitle',
                  )
                : null,
            },
            subtitle: undefined,
          })
        }

        return episode
      }),
    )

    return episodesWithSources as unknown as Episode[]
  }

  public static resolveMovieMediaSources = async (
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
            trailerVideoUpload: undefined,
            videoUpload: undefined,
            mediaSources: {
              videoSource: this._getMovieVideoSource(vid, 'vid', quality),
              trailerSource: this._getMovieVideoSource(vid, 'trailer', quality),
              subtitleLang: vid.subtitle?.language,
              subtitleSource: vid.subtitle
                ? await MediaAccess.getSignedUrl(vid.subtitle.bucket, vid.subtitle.key, 'subtitle')
                : null,
            },
            subtitle: undefined,
          })
        }

        return vid
      }),
    )

    return getPromiseAllFulfilledResults(movies)
  }
}
